import { describe, expect, it } from 'vitest'
import { deriveShipment } from './shipment-view'
import { NOW, at, etaUpdate, event, facts, multimodalLegs } from './test-fixtures'

const road = (events: ReturnType<typeof event>[]) => deriveShipment(facts({ events }), NOW).eta
// Vessel due 10 h ago, committed delivery in 38 h.
const atSea = (events: ReturnType<typeof event>[]) =>
  deriveShipment(facts({ legs: multimodalLegs(-10), destinationCountry: 'MX', events }), NOW).eta

describe('BR-ETA-01 Delivered', () => {
  it('is the actual delivery date, confirmed', () => {
    const delivered = event('delivered', 1, -1)

    expect(road([etaUpdate(1, -3, 20), delivered])).toMatchObject({
      value: at(-1),
      provenance: 'confirmed',
      source: 'op_tir',
      rawEventId: delivered.rawEventId,
    })
  })
})

describe('BR-ETA-02 Operator estimate, last leg', () => {
  it('is the latest ETA update from the last leg operator', () => {
    const latest = etaUpdate(1, -1, 14)

    expect(road([event('departed_site', 1, -3), etaUpdate(1, -2, 20), latest])).toMatchObject({
      value: at(14),
      provenance: 'estimated',
      source: 'op_tir',
      observedAt: at(-1),
      rawEventId: latest.rawEventId,
    })
  })
})

describe('BR-ETA-03 Operator estimate, earlier leg', () => {
  it('carries the earlier leg delay forward, sourced to the system', () => {
    const update = etaUpdate(2, -30, 20)

    expect(atSea([update])).toMatchObject({
      value: at(68),
      provenance: 'estimated',
      source: 'system',
      rawEventId: update.rawEventId,
    })
  })

  it('stops once that leg arrival is done, then BR-ETA-04 applies', () => {
    const arrived = event('vessel_arrived', 2, -5)

    expect(atSea([etaUpdate(2, -30, 20), arrived])).toMatchObject({
      value: at(43),
      source: 'system',
      rawEventId: arrived.rawEventId,
    })
  })
})

describe('BR-ETA-04 System estimate', () => {
  it('adds the delay of the latest done milestone to the committed date', () => {
    // Departure planned at −3 h, reported at −1 h.
    expect(road([event('departed_site', 1, -1)])).toMatchObject({
      value: at(12),
      provenance: 'estimated',
      source: 'system',
    })
  })

  it('never moves the ETA earlier for an early milestone', () => {
    expect(road([event('departed_site', 1, -4)]).value).toBe(at(10))
  })

  it('before any event is the committed date from the booking, 48 h before departure', () => {
    expect(road([])).toEqual({
      value: at(10),
      provenance: 'estimated',
      source: 'booking',
      observedAt: at(-51),
      rawEventId: null,
      outdated: false,
    })
  })
})

describe('BR-ETA-05 Unknown', () => {
  it('a very stale shipment keeps its ETA and provenance, flagged outdated', () => {
    const eta = road([event('departed_site', 1, -25)])

    expect(eta).toMatchObject({ source: 'system', outdated: true })
    expect(road([event('departed_site', 1, -13)]).outdated).toBe(false)
  })
})

describe('BR-ETA-06 Predicted ETA', () => {
  it('is returned separately and never replaces the ETA', () => {
    const view = deriveShipment(
      facts({ legs: multimodalLegs(200, 'BW Meridian'), destinationCountry: 'MX' }),
      NOW,
    )

    expect(view.eta.value).toBe(at(248))
    expect(view.prediction?.predictedEta).not.toBe(view.eta.value)
  })
})
