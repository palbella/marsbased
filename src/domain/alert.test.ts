import { describe, expect, it } from 'vitest'
import { alertSchema } from './alert'

const alert = {
  id: 'alr_003',
  shipmentId: 'shp_016',
  shipmentReference: 'SH-10436',
  type: 'late',
  title: 'Delivery delayed by ~1 day',
  message: 'BlueWave reported a later arrival at Veracruz.',
  etaImpact: {
    previousEta: {
      value: '2026-11-13T10:00:00Z',
      provenance: 'estimated',
      source: 'booking',
      observedAt: '2026-10-20T09:00:00Z',
    },
    newEta: {
      value: '2026-11-14T16:00:00Z',
      provenance: 'estimated',
      source: 'op_bws',
      observedAt: '2026-11-05T08:00:00Z',
    },
  },
  requiresAction: false,
  createdAt: '2026-11-05T08:00:00Z',
  readAt: null,
}

describe('alertSchema', () => {
  it('parses an alert with its ETA impact (BR-AL-03)', () => {
    expect(alertSchema.parse(alert)).toEqual(alert)
  })

  it('parses an alert without ETA impact', () => {
    expect(alertSchema.safeParse({ ...alert, type: 'message', etaImpact: null }).success).toBe(true)
  })

  it('rejects a type outside BR-AL-01', () => {
    expect(alertSchema.safeParse({ ...alert, type: 'stale' }).success).toBe(false)
  })

  it('rejects an ETA impact without provenance (P1)', () => {
    const etaImpact = { previousEta: null, newEta: { value: '2026-11-14T16:00:00Z' } }
    expect(alertSchema.safeParse({ ...alert, etaImpact }).success).toBe(false)
  })
})
