import { describe, expect, it } from 'vitest'
import { deriveShipment } from './shipment-view'
import { event, facts, multimodalLegs } from './test-fixtures'

const multimodal = (events: ReturnType<typeof event>[]) =>
  deriveShipment(
    facts({ legs: multimodalLegs(-10), destinationCountry: 'MX', events }),
    new Date('2026-11-10T12:00:00.000Z'),
  )

describe('BR-ST-01 Status from the latest done milestone', () => {
  it.each([
    [[], 'booked'],
    [[event('picked_up', 1, -400)], 'in_transit'],
    [[event('arrived_port', 1, -360)], 'at_port'],
    [[event('vessel_departed', 2, -346)], 'in_transit'],
    [[event('discharged', 2, -8)], 'at_port'],
    [[event('customs_submitted', 2, -6)], 'in_customs'],
    [[event('customs_cleared', 2, -4)], 'at_port'],
    [[event('picked_up', 3, -3)], 'in_transit'],
    [[event('out_for_delivery', 3, -2)], 'out_for_delivery'],
    [[event('delivered', 3, -1)], 'delivered'],
  ] as const)('%#: %j → %s', (events, status) => {
    expect(multimodal([...events]).status).toBe(status)
  })

  it('uses plan order, not time order: customs submitted before discharge is in customs', () => {
    const view = multimodal([event('customs_submitted', 2, -9), event('discharged', 2, -8)])

    expect(view.status).toBe('in_customs')
  })
})

describe('BR-ST-02 Customs hold', () => {
  it('an open hold overrides the status to on_hold', () => {
    const submitted = event('customs_submitted', 2, -9)

    expect(multimodal([submitted, event('customs_hold', 2, -5)]).status).toBe('on_hold')
    expect(
      multimodal([submitted, event('customs_hold', 2, -5), event('customs_cleared', 2, -1)]).status,
    ).toBe('at_port')
  })
})

describe('BR-MS-06 Current leg', () => {
  it('is the first leg before any event', () => {
    expect(multimodal([]).currentLeg.id).toBe('leg_t_1')
  })

  it('moves to the next leg once the last milestone of a leg is done', () => {
    expect(multimodal([event('departed_site', 1, -362)]).currentLeg.id).toBe('leg_t_1')
    expect(multimodal([event('arrived_port', 1, -360)]).currentLeg.id).toBe('leg_t_2')
  })

  it('keeps the sea leg current through customs until clearance', () => {
    expect(multimodal([event('discharged', 2, -8)]).currentLeg.id).toBe('leg_t_2')
    expect(multimodal([event('customs_submitted', 2, -6)]).currentLeg.id).toBe('leg_t_2')
    expect(multimodal([event('customs_cleared', 2, -4)]).currentLeg.id).toBe('leg_t_3')
  })
})
