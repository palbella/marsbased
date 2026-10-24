import { describe, expect, it } from 'vitest'
import { planMilestones } from './milestone-plan'
import { NOW, at, event, multimodalLegs, roadLegs } from './test-fixtures'
import { buildTimeline, customsHolds } from './timeline'

const BOOKED_AT = at(-100)
const roadTimeline = (events: ReturnType<typeof event>[], now = NOW) =>
  buildTimeline(planMilestones(roadLegs(), 'ES'), events, BOOKED_AT, now)
const stateOf = (timeline: ReturnType<typeof roadTimeline>, type: string) =>
  timeline.find((milestone) => milestone.type === type)?.state

describe('BR-MS-04 Milestone state', () => {
  it('done with an actual, not_reported when a later one is done', () => {
    const timeline = roadTimeline([event('departed_site', 1, -3)])

    expect(stateOf(timeline, 'departed_site')).toBe('done')
    expect(stateOf(timeline, 'picked_up')).toBe('not_reported')
  })

  it('overdue more than 2 h after its planned date, pending before', () => {
    // Pickup planned at −5 h.
    expect(stateOf(roadTimeline([], new Date(at(-3.5))), 'picked_up')).toBe('pending')
    expect(stateOf(roadTimeline([]), 'picked_up')).toBe('overdue')
    expect(stateOf(roadTimeline([]), 'delivered')).toBe('pending')
  })

  it('planned dates come from the booking, estimated', () => {
    const [pickedUp] = roadTimeline([])

    expect(pickedUp?.planned).toEqual({
      value: at(-5),
      provenance: 'estimated',
      source: 'booking',
      observedAt: BOOKED_AT,
    })
  })
})

describe('BR-NM-02 Provenance', () => {
  it('a reported event fills the actual as confirmed, sourced to its operator', () => {
    const [pickedUp] = roadTimeline([event('picked_up', 1, -5)])

    expect(pickedUp?.actual).toMatchObject({
      value: at(-5),
      provenance: 'confirmed',
      source: 'op_tir',
    })
  })

  it('an event flagged as an estimate fills it as estimated', () => {
    const [pickedUp] = roadTimeline([event('picked_up', 1, -5, { isEstimate: true })])

    expect(pickedUp?.actual?.provenance).toBe('estimated')
  })
})

describe('BR-NM-05 Traceability', () => {
  it('each milestone keeps the raw event it came from', () => {
    const pickup = event('picked_up', 1, -5)

    expect(roadTimeline([pickup])[0]?.rawEventId).toBe(pickup.rawEventId)
  })
})

describe('BR-NM-06 Out-of-plan events', () => {
  it('a mapped event whose milestone is not in its leg plan changes nothing', () => {
    const timeline = roadTimeline([event('vessel_departed', 1, -2)])

    expect(timeline.every((milestone) => milestone.actual === null)).toBe(true)
  })

  it('matches milestones by leg, so a last-mile pickup does not fill the first one', () => {
    const plan = planMilestones(multimodalLegs(-50), 'MX')
    const timeline = buildTimeline(plan, [event('picked_up', 3, -1)], BOOKED_AT, NOW)
    const pickups = timeline.filter((milestone) => milestone.type === 'picked_up')

    expect(pickups.map((milestone) => milestone.state)).toEqual(['not_reported', 'done'])
  })
})

describe('BR-MS-05 Customs hold', () => {
  it('a hold stays open until a later customs_cleared arrives', () => {
    const hold = event('customs_hold', 2, -5)

    expect(customsHolds([hold])).toMatchObject([{ rawEventId: hold.rawEventId, open: true }])
    expect(customsHolds([event('customs_cleared', 2, -8), hold])[0]?.open).toBe(true)
    expect(customsHolds([hold, event('customs_cleared', 2, -1)])[0]?.open).toBe(false)
  })
})
