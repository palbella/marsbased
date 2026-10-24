import { describe, expect, it } from 'vitest'
import { planMilestones } from './milestone-plan'
import { at, multimodalLegs, roadLegs } from './test-fixtures'

const types = (legs: ReturnType<typeof roadLegs>, country: string) =>
  planMilestones(legs, country).map((milestone) => milestone.type)

describe('BR-MS-01 Plan per leg', () => {
  it('plans a single road leg as pickup, departure, out for delivery and delivery', () => {
    expect(types(roadLegs(), 'ES')).toEqual([
      'picked_up',
      'departed_site',
      'out_for_delivery',
      'delivered',
    ])
  })

  it('plans road to port, sea, customs and last mile in that order', () => {
    expect(types(multimodalLegs(100), 'MX')).toEqual([
      'picked_up',
      'departed_site',
      'arrived_port',
      'loaded_on_vessel',
      'vessel_departed',
      'vessel_arrived',
      'discharged',
      'customs_submitted',
      'customs_cleared',
      'picked_up',
      'out_for_delivery',
      'delivered',
    ])
  })
})

describe('BR-MS-02 Customs', () => {
  it('adds customs outside the EU customs union, on the sea leg', () => {
    const customs = planMilestones(multimodalLegs(100), 'MX').filter((m) => m.customs)

    expect(customs.map((milestone) => milestone.type)).toEqual([
      'customs_submitted',
      'customs_cleared',
    ])
    expect(customs.every((milestone) => milestone.legId === 'leg_t_2')).toBe(true)
  })

  it('adds no customs for an intra-EU destination', () => {
    expect(types(multimodalLegs(100), 'FR')).not.toContain('customs_submitted')
    expect(types(roadLegs(), 'FR')).not.toContain('customs_submitted')
  })
})

describe('BR-MS-03 Planned dates', () => {
  it('derives each planned date from its leg', () => {
    // Legs: road −268 → −260, sea −236 → 100, last mile 136 → 148.
    const planned = Object.fromEntries(
      planMilestones(multimodalLegs(100), 'MX').map((m) => [`${m.legId}:${m.type}`, m.plannedAt]),
    )

    expect(planned).toMatchObject({
      'leg_t_1:picked_up': at(-270),
      'leg_t_1:departed_site': at(-268),
      'leg_t_1:arrived_port': at(-260),
      'leg_t_2:loaded_on_vessel': at(-248),
      'leg_t_2:vessel_departed': at(-236),
      'leg_t_2:vessel_arrived': at(100),
      'leg_t_2:discharged': at(112),
      'leg_t_2:customs_submitted': at(100),
      'leg_t_2:customs_cleared': at(124),
      'leg_t_3:picked_up': at(134),
      'leg_t_3:out_for_delivery': at(142),
      'leg_t_3:delivered': at(148),
    })
  })
})
