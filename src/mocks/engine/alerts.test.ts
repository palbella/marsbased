import { describe, expect, it } from 'vitest'
import { eventBuilders } from '@/mocks/db/tables/raw-events/builders'
import { applyExceptionAction } from './actions/apply-action'
import { recompute } from './recompute'
import { NOW } from './test-fixtures'
import { alertsOf, clock, hoursLater, ingest, openExceptions, seededTables } from './test-db'

const { tir, tirEta, bws } = eventBuilders(clock)

const typesOf = (db: ReturnType<typeof seededTables>, shipmentId: string) =>
  alertsOf(db, shipmentId).map((alert) => alert.type)

describe('BR-AL-01 Triggers', () => {
  it('at_risk when the indicator goes from on_time to at_risk (SH-10404, +5 h)', () => {
    const db = seededTables()
    recompute(db, 'shp_004', NOW)

    expect(alertsOf(db, 'shp_004')).toMatchObject([{ type: 'at_risk', accountId: 'acc_001' }])
  })

  it('late when the indicator becomes late (SH-10409)', () => {
    const db = seededTables()
    recompute(db, 'shp_009', NOW)

    expect(typesOf(db, 'shp_009')).toEqual(['late'])
  })

  it('eta_changed when the ETA moves over 12 h from the last alerted ETA', () => {
    const db = seededTables()
    recompute(db, 'shp_009', NOW)
    ingest(db, 'shp_009', tirEta(39, -0.5, 'Almansa'))
    ingest(db, 'shp_009', tirEta(30, -0.2, 'Almansa'))

    expect(typesOf(db, 'shp_009')).toEqual(['late', 'eta_changed'])
  })

  it('on_hold when a hold is opened (SIM-02 on SH-10447)', () => {
    const db = seededTables()
    recompute(db, 'shp_020', NOW)
    ingest(db, 'shp_020', bws('CHLD', -0.2, 'BW Aurora', 'MXVER'))

    expect(typesOf(db, 'shp_020')).toEqual(['on_hold'])
  })

  it('customs_issue when a customs incident is raised (SH-10444)', () => {
    const db = seededTables()
    recompute(db, 'shp_019', NOW)

    expect(typesOf(db, 'shp_019')).toEqual(['customs_issue'])
  })

  it('delivered when the shipment is delivered (SIM-05 on SH-10401)', () => {
    const db = seededTables()
    recompute(db, 'shp_001', NOW)
    ingest(db, 'shp_001', tir('500', -0.2, 'Madrid'))

    expect(typesOf(db, 'shp_001')).toEqual(['delivered'])
  })

  it('compares a first evaluation against on_time and the committed date', () => {
    const db = seededTables()
    recompute(db, 'shp_001', NOW)

    expect(alertsOf(db, 'shp_001')).toEqual([])
    expect(db.shipmentEvaluations.findById('shp_001')).toMatchObject({
      onTime: 'on_time',
      status: 'in_transit',
      evaluatedAt: NOW.toISOString(),
    })
  })
})

describe('BR-AL-02 Not for internal issues', () => {
  it('stale and missing documents raise exceptions but no alerts', () => {
    const db = seededTables()
    recompute(db, 'shp_006', NOW)
    recompute(db, 'shp_017', NOW)

    expect(openExceptions(db, 'shp_006').map((row) => row.type)).toEqual(['stale'])
    expect(openExceptions(db, 'shp_017').map((row) => row.type)).toEqual(['missing_document'])
    expect([...alertsOf(db, 'shp_006'), ...alertsOf(db, 'shp_017')]).toEqual([])
  })
})

describe('BR-AL-03 Content', () => {
  it('has a title, what happened, the ETA impact with provenance and requiresAction', () => {
    const db = seededTables()
    recompute(db, 'shp_009', NOW)

    expect(alertsOf(db, 'shp_009')[0]).toMatchObject({
      title: 'SH-10409 is running late',
      message: 'Delivery is now expected about 16 h after the committed date.',
      etaImpact: {
        previousEta: { provenance: 'estimated', source: 'booking' },
        newEta: { provenance: 'estimated', source: 'op_tir' },
      },
      requiresAction: false,
    })
  })

  it('requiresAction is true only for an ops message flagged as such', () => {
    const db = seededTables()
    recompute(db, 'shp_009', NOW)
    const [delay] = openExceptions(db, 'shp_009')
    const payload = { subject: 'Delay', message: 'Please confirm.', requiresAction: true }
    const request = { type: 'notify_customer', payload }
    applyExceptionAction(db, { exceptionId: delay?.id ?? '', userId: 'usr_010', request, now: NOW })

    expect(alertsOf(db, 'shp_009').map((alert) => alert.requiresAction)).toEqual([false, true])
  })
})

describe('BR-AL-04 Deduplication', () => {
  it('repeated evaluations and events with the same outcome create no new alerts', () => {
    const db = seededTables()
    recompute(db, 'shp_009', NOW)
    recompute(db, 'shp_009', hoursLater(1))
    ingest(db, 'shp_009', tirEta(26, -0.5, 'Almansa'))

    expect(typesOf(db, 'shp_009')).toEqual(['late'])
  })

  it('a repeated hold report is not alerted twice', () => {
    const db = seededTables()
    recompute(db, 'shp_018', NOW)
    recompute(db, 'shp_018', hoursLater(1))

    expect(typesOf(db, 'shp_018')).toEqual(['on_hold'])
  })
})

describe('BR-AL-05 One alert per change', () => {
  it('keeps the most important trigger, with the ETA impact (SH-10436: late + ETA +30 h)', () => {
    const db = seededTables()
    recompute(db, 'shp_016', NOW)

    expect(alertsOf(db, 'shp_016')).toMatchObject([
      { type: 'late', etaImpact: { newEta: { source: 'system' } } },
    ])
  })
})
