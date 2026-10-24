import { describe, expect, it } from 'vitest'
import { eventBuilders } from '@/mocks/db/tables/raw-events/builders'
import { applyExceptionAction } from './actions/apply-action'
import { confirmMapping } from './mappings'
import { recompute, recomputeAll } from './recompute'
import { NOW } from './test-fixtures'
import { clock, hoursLater, ingest, openExceptions, seededTables } from './test-db'

const { tir, tirEta, eur } = eventBuilders(clock)
// SH-10409: TIR moved its ETA 16 h past the committed date (07 §4).
const SH_10409 = 'shp_009'

function withDelay() {
  const db = seededTables()
  recompute(db, SH_10409, NOW)
  const [delay] = openExceptions(db, SH_10409)
  if (!delay) throw new Error('SH-10409 should have a delay')
  return { db, delay }
}

describe('BR-EX-06 One open exception per shipment and type', () => {
  it('updates the severity of the open exception instead of raising another', () => {
    const { db, delay } = withDelay()
    recompute(db, SH_10409, NOW)
    ingest(db, SH_10409, tirEta(40, -0.5, 'Almansa'))

    expect(openExceptions(db, SH_10409)).toEqual([{ ...delay, severity: 'high' }])
  })
})

describe('BR-EX-07 Auto-resolution', () => {
  it('resolves the exception with an activity entry when the condition no longer holds', () => {
    const { db, delay } = withDelay()
    ingest(db, SH_10409, tirEta(10, -0.5, 'Almansa'))

    expect(db.exceptions.findById(delay.id)).toMatchObject({
      status: 'resolved',
      resolvedAt: NOW.toISOString(),
    })
    expect(db.activity.all().at(-1)).toMatchObject({
      exceptionId: delay.id,
      userId: null,
      type: 'exception_auto_resolved',
      payload: { reason: 'Resolved automatically: the ETA is back within the committed date' },
    })
  })

  it('resolves every open exception when the shipment is delivered', () => {
    const { db } = withDelay()
    ingest(db, SH_10409, tir('500', -0.2, 'Murcia'))

    expect(openExceptions(db, SH_10409)).toEqual([])
  })
})

describe('BR-EX-08 Manual resolution', () => {
  const resolveByHand = () => {
    const { db, delay } = withDelay()
    const request = { type: 'resolve', payload: { note: 'Customer agreed new date' } }
    applyExceptionAction(db, { exceptionId: delay.id, userId: 'usr_010', request, now: NOW })
    return db
  }

  it('is not reopened while the condition still holds', () => {
    const db = resolveByHand()
    recompute(db, SH_10409, hoursLater(1))

    expect(openExceptions(db, SH_10409)).toEqual([])
  })

  it('is reopened when a new event arrives after the resolution', () => {
    const db = resolveByHand()
    ingest(db, SH_10409, tir('900', 0.5, 'Albacete'), hoursLater(1))

    expect(openExceptions(db, SH_10409).map((row) => row.type)).toEqual(['delay'])
  })

  it('is reopened when the severity increases', () => {
    // SH-10406: silent for 15 h, stale medium; very stale (high) after 24 h.
    const db = seededTables()
    recompute(db, 'shp_006', NOW)
    const [stale] = openExceptions(db, 'shp_006')
    const request = { type: 'resolve', payload: { note: 'Driver on a rest break' } }
    applyExceptionAction(db, { exceptionId: stale?.id ?? '', userId: 'usr_011', request, now: NOW })

    recompute(db, 'shp_006', hoursLater(6))
    expect(openExceptions(db, 'shp_006')).toEqual([])
    recompute(db, 'shp_006', hoursLater(10))
    expect(openExceptions(db, 'shp_006')).toMatchObject([{ type: 'stale', severity: 'high' }])
  })
})

describe('BR-EX-09 Lifecycle', () => {
  it('goes open → acknowledged → resolved, and can wait on the operator', () => {
    const { db, delay } = withDelay()
    const act = (request: unknown) =>
      applyExceptionAction(db, { exceptionId: delay.id, userId: 'usr_010', request, now: NOW })

    expect(delay.status).toBe('open')
    act({ type: 'contact_operator', payload: { operatorId: 'op_tir', message: 'New ETA?' } })
    expect(db.exceptions.findById(delay.id)).toMatchObject({
      status: 'acknowledged',
      waitingOn: 'operator',
    })
    act({ type: 'resolve', payload: { note: 'Handled' } })
    expect(db.exceptions.findById(delay.id)?.status).toBe('resolved')
  })
})

describe('BR-EX-10 When the engine runs', () => {
  it('after a raw event: ingestion recomputes the shipment', () => {
    const db = seededTables()
    const changes = ingest(db, 'shp_001', tir('500', -0.2, 'Madrid'))

    expect(changes).toContainEqual({ type: 'shipment.updated', shipmentId: 'shp_001' })
  })

  it('for all shipments when the clock advances (SIM-03: SH-10421 goes stale)', () => {
    const db = seededTables()
    recomputeAll(db, NOW)
    expect(openExceptions(db, 'shp_012')).toEqual([])

    recomputeAll(db, hoursLater(2))
    expect(openExceptions(db, 'shp_012')).toMatchObject([{ type: 'stale', severity: 'medium' }])
  })

  it('after a confirmed mapping, for each shipment with reprocessed events (BR-NM-03)', () => {
    const db = seededTables()
    const changes = confirmMapping(
      db,
      { operatorId: 'op_eur', rawCode: 'RET-PLAT', target: 'position_update' },
      NOW,
    )

    expect(db.rawEvents.where((row) => row.mappingStatus === 'unmapped')).toEqual([])
    expect(changes).toContainEqual({ type: 'mapping.changed' })
    expect(changes).toContainEqual({ type: 'shipment.updated', shipmentId: 'shp_008' })
    expect(changes).toContainEqual({ type: 'shipment.updated', shipmentId: 'shp_010' })
  })

  it('reprocessing ignores events with another code', () => {
    const db = seededTables()
    ingest(db, 'shp_006', { ...eur('XYZ', -1, 'BILBAO'), mappingStatus: 'unmapped' })
    confirmMapping(db, { operatorId: 'op_eur', rawCode: 'RET-PLAT', target: 'ignore' }, NOW)

    expect(db.rawEvents.where((row) => row.mappingStatus === 'unmapped')).toHaveLength(1)
  })
})
