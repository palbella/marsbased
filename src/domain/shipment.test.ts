import { describe, expect, it } from 'vitest'
import { shipmentSchema } from './shipment'
import { timelineSchema } from './timeline'

const shipment = {
  id: 'shp_016',
  reference: 'SH-10436',
  accountId: 'acc_005',
  accountName: 'Corvane México S.A. de C.V.',
  originSiteId: 'site_vlc',
  originSiteName: 'Valencia Warehouse',
  destination: { city: 'Querétaro', country: 'MX', international: true },
  legs: [
    {
      id: 'leg_041',
      sequence: 1,
      mode: 'sea',
      operatorId: 'op_bws',
      operatorName: 'BlueWave Shipping Line',
      from: 'Valencia port',
      to: 'Veracruz port',
      plannedDeparture: '2026-11-01T10:00:00Z',
      plannedArrival: '2026-11-12T10:00:00Z',
      trackingNumber: 'BWS-BL-77812',
      vessel: 'BW Aurora',
    },
  ],
  currentLegId: 'leg_041',
  status: 'in_transit',
  eta: {
    value: '2026-11-14T16:00:00Z',
    provenance: 'estimated',
    source: 'op_bws',
    observedAt: '2026-11-05T08:00:00Z',
    outdated: false,
    rawEventId: 'raw_120',
    basis: 'BlueWave moved the vessel arrival 2 h ago',
  },
  plannedEta: '2026-11-13T10:00:00Z',
  onTime: 'late',
  lastEventAt: '2026-11-05T08:00:00Z',
  stale: false,
  hasCustoms: true,
  lastDoneMilestone: { type: 'vessel_departed', legId: 'leg_041' },
  openExceptionCount: 1,
}

const timeline = {
  shipmentId: 'shp_016',
  milestones: [
    {
      id: 'ms_001',
      legId: 'leg_041',
      type: 'vessel_departed',
      state: 'done',
      planned: {
        value: '2026-11-01T10:00:00Z',
        provenance: 'estimated',
        source: 'booking',
        observedAt: '2026-10-20T09:00:00Z',
      },
      actual: {
        value: '2026-11-02T04:00:00Z',
        provenance: 'confirmed',
        source: 'op_bws',
        observedAt: '2026-11-02T04:05:00Z',
      },
      rawEventId: 'raw_119',
    },
    { id: 'ms_002', legId: null, type: 'customs_submitted', state: 'pending' },
  ],
  customsHolds: [],
}

describe('shipmentSchema', () => {
  it('parses a shipment detail', () => {
    expect(shipmentSchema.parse(shipment)).toEqual(shipment)
  })

  it('accepts an unknown ETA as null (P1)', () => {
    expect(shipmentSchema.safeParse({ ...shipment, eta: null }).success).toBe(true)
  })

  it('rejects a status outside BR-ST-01', () => {
    expect(shipmentSchema.safeParse({ ...shipment, status: 'lost' }).success).toBe(false)
  })

  it('rejects an on-time indicator outside BR-OT-01', () => {
    expect(shipmentSchema.safeParse({ ...shipment, onTime: 'delayed' }).success).toBe(false)
  })

  it('rejects an ETA without provenance (P1)', () => {
    const eta = { value: '2026-11-14T16:00:00Z', outdated: false, rawEventId: null }
    expect(shipmentSchema.safeParse({ ...shipment, eta }).success).toBe(false)
  })

  it('rejects dates that are not ISO 8601 UTC (BR-TM-02)', () => {
    expect(shipmentSchema.safeParse({ ...shipment, plannedEta: '13/11/2026' }).success).toBe(false)
  })
})

describe('timelineSchema', () => {
  it('parses milestones with their state (BR-MS-04)', () => {
    expect(timelineSchema.parse(timeline)).toEqual(timeline)
  })

  it('parses an open customs hold (BR-MS-05)', () => {
    const hold = {
      id: 'hold_001',
      reportedAt: {
        value: '2026-11-05T03:00:00Z',
        provenance: 'confirmed',
        source: 'op_bws',
        observedAt: '2026-11-05T03:02:00Z',
      },
      open: true,
      rawEventId: 'raw_130',
    }
    expect(timelineSchema.safeParse({ ...timeline, customsHolds: [hold] }).success).toBe(true)
  })

  it('rejects a milestone state outside BR-MS-04', () => {
    const milestones = [{ id: 'ms_003', legId: null, type: 'delivered', state: 'skipped' }]
    expect(timelineSchema.safeParse({ ...timeline, milestones }).success).toBe(false)
  })

  it('rejects a provenance outside P1', () => {
    const milestone = timeline.milestones[0]
    const planned = { ...milestone?.planned, provenance: 'guessed' }
    const milestones = [{ ...milestone, planned }]
    expect(timelineSchema.safeParse({ ...timeline, milestones }).success).toBe(false)
  })
})
