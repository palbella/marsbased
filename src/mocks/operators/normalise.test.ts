import { describe, expect, it } from 'vitest'
import { createClock } from '@/mocks/clock'
import { operatorsSeed } from '@/mocks/db/tables/operators'
import { rawEventsSeed, type OperatorPayload, type RawEventRow } from '@/mocks/db/tables/raw-events'
import { statusMappingsSeed, type StatusMappingRow } from '@/mocks/db/tables/status-mappings'
import { findMappingTarget } from './mapping'
import { normaliseEvents } from './normalise'

function rawEvent(
  id: string,
  operatorId: string,
  payload: OperatorPayload,
  receivedAt: string,
): RawEventRow {
  return { id, legId: 'leg_test_1', operatorId, payload, receivedAt, mappingStatus: 'mapped' }
}

const eur = (id: string, line: string, receivedAt: string) =>
  rawEvent(id, 'op_eur', line, receivedAt)
const normalise = (rows: RawEventRow[], mappings: StatusMappingRow[] = statusMappingsSeed) =>
  normaliseEvents(rows, operatorsSeed, mappings)

describe('BR-NM-01 Mapping', () => {
  it('looks up (operatorId, code) for every kind of target', () => {
    expect(findMappingTarget(statusMappingsSeed, 'op_bws', 'VD')).toBe('vessel_departed')
    expect(findMappingTarget(statusMappingsSeed, 'op_eur', 'NEWETA')).toBe('eta_update')
    expect(findMappingTarget(statusMappingsSeed, 'op_tir', '900')).toBe('position_update')
    expect(findMappingTarget(statusMappingsSeed, 'op_tir', 'VD')).toBeNull()
  })

  it('matches lmx-text statuses exactly, case-sensitive (07 §3)', () => {
    expect(findMappingTarget(statusMappingsSeed, 'op_lmx', 'Delivered')).toBe('delivered')
    expect(findMappingTarget(statusMappingsSeed, 'op_lmx', 'delivered')).toBeNull()
  })

  it('takes the new ETA from the payload date and dates the update on reception (04 §2)', () => {
    const [update] = normalise([
      eur('evt_1', 'NEWETA;2026-11-12;10:00;ZARAGOZA', '2026-11-10T08:20:00.000Z'),
    ])

    expect(update).toMatchObject({
      target: 'eta_update',
      eta: '2026-11-12T10:00:00.000Z',
      occurredAt: '2026-11-10T08:20:00.000Z',
    })
  })

  it('keeps the ETA field of formats that carry one (tir-json code 700)', () => {
    const [update] = normalise([
      rawEvent(
        'evt_1',
        'op_tir',
        {
          code: '700',
          ts: '2026-11-10T08:15:00Z',
          location: 'Almansa',
          eta: '2026-11-11T12:00:00Z',
        },
        '2026-11-10T08:20:00.000Z',
      ),
    ])

    expect(update).toMatchObject({
      eta: '2026-11-11T12:00:00.000Z',
      occurredAt: '2026-11-10T08:20:00.000Z',
    })
  })
})

describe('BR-NM-03 Unmapped events', () => {
  const retPlat = eur('evt_1', 'RET-PLAT;2026-11-10;05:00;BARCELONA', '2026-11-10T05:05:00.000Z')

  it('keeps an event with no mapping, flagged unmapped', () => {
    expect(normalise([retPlat])).toMatchObject([{ code: 'RET-PLAT', target: null }])
  })

  it('reprocesses past events once the mapping is confirmed', () => {
    const confirmed = [
      ...statusMappingsSeed,
      { id: 'map_new', operatorId: 'op_eur', rawCode: 'RET-PLAT', target: 'ignore' as const },
    ]

    expect(normalise([retPlat], confirmed)).toMatchObject([{ target: 'ignore' }])
  })

  it('agrees with the mapping status stored on every seeded raw event', () => {
    const rows = rawEventsSeed(createClock(() => 0))
    const byId = new Map(normalise(rows).map((event) => [event.rawEventId, event]))

    expect(byId.size).toBe(rows.length)
    for (const row of rows) {
      const mapped = byId.get(row.id)?.target !== null
      expect(mapped ? 'mapped' : 'unmapped', row.id).toBe(row.mappingStatus)
    }
  })
})

describe('BR-NM-04 Duplicates and order', () => {
  it('ignores a repeat with the same operator, leg, code and occurredAt', () => {
    const events = normalise([
      eur('evt_1', 'DP;2026-11-10;08:15;BARCELONA', '2026-11-10T08:20:00.000Z'),
      eur('evt_2', 'DP;2026-11-10;08:15;BARCELONA', '2026-11-10T09:00:00.000Z'),
    ])

    expect(events.map((event) => event.rawEventId)).toEqual(['evt_1'])
  })

  it('applies events in occurredAt order, so a late event fills an earlier milestone', () => {
    const events = normalise([
      eur('evt_1', 'DP;2026-11-10;08:15;BARCELONA', '2026-11-10T08:20:00.000Z'),
      eur('evt_2', 'PU;2026-11-10;06:00;BARCELONA', '2026-11-10T09:00:00.000Z'),
    ])

    expect(events.map((event) => event.code)).toEqual(['PU', 'DP'])
  })
})

describe('BR-NM-05 Traceability', () => {
  it('keeps the raw event id, leg and operator of every normalised event', () => {
    const [event] = normalise([
      eur('evt_7', 'PU;2026-11-10;06:00;BARCELONA', '2026-11-10T06:05:00.000Z'),
    ])

    expect(event).toMatchObject({
      rawEventId: 'evt_7',
      legId: 'leg_test_1',
      operatorId: 'op_eur',
      receivedAt: '2026-11-10T06:05:00.000Z',
    })
  })
})
