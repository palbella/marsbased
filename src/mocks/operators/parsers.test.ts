import { describe, expect, it } from 'vitest'
import type { OperatorPayload, RawEventRow } from '@/mocks/db/tables/raw-events'
import { parseRawEvent } from './parse-event'

const RECEIVED_AT = '2026-11-10T08:20:00.000Z'

function rawEvent(operatorId: string, payload: OperatorPayload): RawEventRow {
  return {
    id: 'evt_test',
    legId: 'leg_test_1',
    operatorId,
    payload,
    receivedAt: RECEIVED_AT,
    mappingStatus: 'mapped',
  }
}

describe('04 §2 operator parsers', () => {
  it('tir-json: numeric code, UTC timestamp and the ETA field', () => {
    const row = rawEvent('op_tir', {
      code: '700',
      ts: '2026-11-10T08:15:00Z',
      location: 'Almansa',
      eta: '2026-11-11T12:00:00Z',
    })

    expect(parseRawEvent(row, 'tir-json')).toEqual({
      code: '700',
      label: '700',
      occurredAt: '2026-11-10T08:15:00.000Z',
      isEstimate: false,
      location: 'Almansa',
      eta: '2026-11-11T12:00:00.000Z',
    })
  })

  it('eur-csv: date and time are read as UTC', () => {
    const row = rawEvent('op_eur', 'DP;2026-11-10;08:15;BARCELONA')

    expect(parseRawEvent(row, 'eur-csv')).toMatchObject({
      code: 'DP',
      occurredAt: '2026-11-10T08:15:00.000Z',
      location: 'BARCELONA',
      eta: null,
    })
  })

  it('pld-json: the gate status is the code and the terminal the location', () => {
    const row = rawEvent('op_pld', {
      status: 'GATE_IN',
      time: '2026-11-10T08:15:00Z',
      terminal: 'ESVLC-T2',
    })

    expect(parseRawEvent(row, 'pld-json')).toMatchObject({
      code: 'GATE_IN',
      occurredAt: '2026-11-10T08:15:00.000Z',
      location: 'ESVLC-T2',
    })
  })

  it('lmx-text: Mexico City local time is converted to UTC and the text trimmed', () => {
    const row = rawEvent('op_lmx', {
      status: '  On delivery route ',
      date: '10/11/2026 09:30',
      city: 'Querétaro',
    })

    expect(parseRawEvent(row, 'lmx-text')).toMatchObject({
      code: 'On delivery route',
      label: 'On delivery route',
      occurredAt: '2026-11-10T15:30:00.000Z',
      location: 'Querétaro',
    })
  })

  it('a payload that does not match its format is not parsed (P1)', () => {
    const row = rawEvent('op_eur', 'not a csv line')

    expect(parseRawEvent(row, 'eur-csv')).toBeNull()
    expect(parseRawEvent(row, 'tir-json')).toBeNull()
  })
})

describe('BR-NM-02 Provenance', () => {
  it('bws-edi carries the operator estimate flag', () => {
    const payload = {
      eventCode: 'ETA',
      isEstimate: true,
      vessel: 'BW Aurora',
      port: 'MXVER',
      eventDateTime: '2026-11-14T06:00:00Z',
    }

    expect(parseRawEvent(rawEvent('op_bws', payload), 'bws-edi')).toMatchObject({
      code: 'ETA',
      isEstimate: true,
      location: 'MXVER',
    })
    expect(
      parseRawEvent(
        rawEvent('op_bws', { ...payload, eventCode: 'VD', isEstimate: false }),
        'bws-edi',
      ),
    ).toMatchObject({ isEstimate: false })
  })
})
