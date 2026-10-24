import { describe, expect, it } from 'vitest'
import { ROUTES } from '@/test/shipment-fixtures'
import {
  currentMilestoneId,
  stopState,
  transitSections,
  transitStops,
  type TransitStop,
} from './transit'

const routeOf = ({ shipment, timeline }: (typeof ROUTES)['multimodalAtSea']) =>
  transitSections(shipment.legs, timeline)

describe('BR-MS-01/02 transit sections', () => {
  it('groups milestones by leg in plan order, with customs between sea and last mile', () => {
    const sections = routeOf(ROUTES.multimodalAtSea)
    expect(sections.map((section) => section.kind)).toEqual(['leg', 'leg', 'customs', 'leg'])
    expect(sections.map((section) => section.milestones.length)).toEqual([3, 4, 2, 3])
  })

  it('road only has a single leg section', () => {
    expect(routeOf(ROUTES.roadInTransit).map((section) => section.kind)).toEqual(['leg'])
  })

  it('SC-04 full: one stop per milestone, customs collapsed into one stop', () => {
    const stops = transitStops(routeOf(ROUTES.multimodalAtSea))
    expect(stops).toHaveLength(11)
    expect(stops.filter((stop) => stop.kind === 'customs')).toHaveLength(1)
  })
})

describe('BR-MS-06 / SC-04 current position', () => {
  it('none when booked', () => {
    const { shipment, timeline } = ROUTES.roadBooked
    expect(currentMilestoneId(shipment.status, timeline)).toBeNull()
  })

  it('the final stop when delivered', () => {
    const { shipment, timeline } = ROUTES.multimodalDelivered
    expect(currentMilestoneId(shipment.status, timeline)).toBe(timeline.milestones.at(-1)?.id)
  })

  it('otherwise the latest done milestone, skipping ones not reported', () => {
    const { shipment, timeline } = ROUTES.multimodalAtSea
    const current = timeline.milestones.find((milestone) => milestone.id === 'ms_4')
    expect(currentMilestoneId(shipment.status, timeline)).toBe('ms_4')
    expect(current?.type).toBe('vessel_departed')
  })
})

describe('BR-MS-04 stop state', () => {
  const customsStop = (route: (typeof ROUTES)['multimodalAtSea']) =>
    transitStops(routeOf(route)).find((stop): stop is TransitStop => stop.kind === 'customs')

  it('customs reads as pending before it starts and done once cleared', () => {
    const pending = customsStop(ROUTES.multimodalAtSea)
    const cleared = customsStop(ROUTES.multimodalDelivered)
    expect(pending && stopState(pending)).toBe('pending')
    expect(cleared && stopState(cleared)).toBe('done')
  })
})
