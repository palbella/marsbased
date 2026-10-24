import { describe, expect, it } from 'vitest'
import { deriveShipment } from './shipment-view'
import { computeStaleness } from './staleness'
import { NOW, at, event, facts } from './test-fixtures'

describe('BR-SL-01 Expected update interval', () => {
  it('is 12 h on road, 48 h at sea and 24 h in customs', () => {
    expect(computeStaleness('in_transit', 'road', at(-1), NOW).intervalHours).toBe(12)
    expect(computeStaleness('in_transit', 'sea', at(-1), NOW).intervalHours).toBe(48)
    expect(computeStaleness('in_customs', 'sea', at(-1), NOW).intervalHours).toBe(24)
    expect(computeStaleness('on_hold', 'sea', at(-1), NOW).intervalHours).toBe(24)
  })
})

describe('BR-SL-02 Stale and very stale', () => {
  it('is stale past the interval and very stale past twice the interval', () => {
    expect(computeStaleness('in_transit', 'road', at(-12), NOW).stale).toBe(false)
    expect(computeStaleness('in_transit', 'road', at(-13), NOW)).toMatchObject({
      stale: true,
      veryStale: false,
    })
    expect(computeStaleness('in_transit', 'road', at(-25), NOW).veryStale).toBe(true)
  })

  it('delivered and booked shipments are never stale', () => {
    expect(computeStaleness('delivered', 'road', at(-100), NOW).stale).toBe(false)
    expect(computeStaleness('booked', 'road', null, NOW).stale).toBe(false)
  })

  it('counts position updates and unmapped events as activity', () => {
    const departed = event('departed_site', 1, -20)

    expect(deriveShipment(facts({ events: [departed] }), NOW).staleness.stale).toBe(true)
    for (const heartbeat of [event('position_update', 1, -2), event(null, 1, -2)]) {
      const view = deriveShipment(facts({ events: [departed, heartbeat] }), NOW)
      expect(view.lastEventAt).toBe(at(-2))
      expect(view.staleness.stale).toBe(false)
    }
  })
})
