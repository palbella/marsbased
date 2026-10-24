import { describe, expect, it } from 'vitest'
import { domainEventSchema } from './events'

// BR-RT-01.
const events = [
  { type: 'shipment.updated', shipmentId: 'shp_016' },
  { type: 'exception.changed', shipmentId: 'shp_016', exceptionId: 'exc_004' },
  { type: 'alert.created', shipmentId: 'shp_016', alertId: 'alr_003' },
  { type: 'document.changed', shipmentId: 'shp_018' },
  { type: 'mapping.changed' },
  { type: 'data.reset' },
]

describe('domainEventSchema', () => {
  it.each(events)('parses a $type event', (event) => {
    expect(domainEventSchema.parse(event)).toEqual(event)
  })

  it('rejects an unknown event type', () => {
    expect(domainEventSchema.safeParse({ type: 'shipment.deleted', shipmentId: 'x' }).success).toBe(
      false,
    )
  })

  it('rejects an exception event without its id', () => {
    const event = { type: 'exception.changed', shipmentId: 'shp_016' }
    expect(domainEventSchema.safeParse(event).success).toBe(false)
  })

  it('strips business data so events stay thin (02 §7)', () => {
    const event = { type: 'shipment.updated', shipmentId: 'shp_016', eta: '2026-11-14T16:00:00Z' }
    expect(domainEventSchema.parse(event)).toEqual({
      type: 'shipment.updated',
      shipmentId: 'shp_016',
    })
  })
})
