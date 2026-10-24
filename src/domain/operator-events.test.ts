import { describe, expect, it } from 'vitest'
import { rawEventSchema } from './operator-events'

const base = {
  id: 'raw_001',
  legId: 'leg_001',
  code: 'DP',
  label: 'Departed',
  occurredAt: '2026-11-10T08:15:00Z',
  receivedAt: '2026-11-10T08:16:00Z',
  mappingStatus: 'mapped',
}

// 07 §3 payload examples.
const rawEvents = [
  {
    ...base,
    operatorId: 'op_tir',
    format: 'tir-json',
    payload: { code: '200', ts: '2026-11-10T08:15:00Z', location: 'Zaragoza', eta: null },
  },
  { ...base, operatorId: 'op_eur', format: 'eur-csv', payload: 'DP;2026-11-10;08:15;BARCELONA' },
  {
    ...base,
    operatorId: 'op_pld',
    format: 'pld-json',
    payload: { status: 'GATE_IN', time: '2026-11-10T08:15:00Z', terminal: 'ESVLC-T2' },
  },
  {
    ...base,
    operatorId: 'op_bws',
    format: 'bws-edi',
    payload: {
      eventCode: 'VD',
      isEstimate: false,
      vessel: 'BW Aurora',
      port: 'ESVLC',
      eventDateTime: '2026-11-10T08:15:00Z',
    },
  },
  {
    ...base,
    operatorId: 'op_lmx',
    format: 'lmx-text',
    payload: { status: 'On delivery route', date: '10/11/2026 09:30', city: 'Querétaro' },
  },
]

describe('rawEventSchema', () => {
  it.each(rawEvents)('parses a $format payload', (rawEvent) => {
    expect(rawEventSchema.parse(rawEvent)).toEqual(rawEvent)
  })

  it('accepts an unmapped code (BR-NM-03)', () => {
    const rawEvent = { ...rawEvents[1], payload: 'RET-PLAT;2026-11-10;08:15;ZARAGOZA' }
    const unmapped = { ...rawEvent, code: 'RET-PLAT', mappingStatus: 'unmapped' }
    expect(rawEventSchema.safeParse(unmapped).success).toBe(true)
  })

  it('rejects an unknown format', () => {
    const rawEvent = { ...rawEvents[0], format: 'xml' }
    expect(rawEventSchema.safeParse(rawEvent).success).toBe(false)
  })

  it('rejects a payload in another operator format', () => {
    const rawEvent = { ...rawEvents[0], format: 'bws-edi' }
    expect(rawEventSchema.safeParse(rawEvent).success).toBe(false)
  })

  it('rejects a malformed eur-csv line', () => {
    const rawEvent = { ...rawEvents[1], payload: 'DP,2026-11-10,08:15,BARCELONA' }
    expect(rawEventSchema.safeParse(rawEvent).success).toBe(false)
  })

  it('rejects an lmx-text date not in DD/MM/YYYY HH:mm', () => {
    const payload = { status: 'Delivered', date: '2026-11-10T09:30:00Z', city: 'Querétaro' }
    expect(rawEventSchema.safeParse({ ...rawEvents[4], payload }).success).toBe(false)
  })

  it('rejects a mapping status outside BR-NM-03', () => {
    const rawEvent = { ...rawEvents[0], mappingStatus: 'pending' }
    expect(rawEventSchema.safeParse(rawEvent).success).toBe(false)
  })
})
