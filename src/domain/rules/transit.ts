import type { Leg, ShipmentStatus } from '../shipment'
import type { CustomsHold, Milestone, MilestoneState, Timeline } from '../timeline'

// DS-04, SC-04, SC-05: the route as the transit line and the timeline both draw it.

// BR-MS-01/02: milestones in plan order, grouped by leg; the customs block (legId null)
// sits between the sea leg and the last mile.
export type TransitSection =
  | { kind: 'leg'; leg: Leg; milestones: Milestone[] }
  | { kind: 'customs'; milestones: Milestone[]; holds: CustomsHold[] }

// SC-04 full variant: one stop per milestone, customs collapsed into one stamp-shaped stop.
export type TransitStop =
  | { kind: 'milestone'; milestone: Milestone; sectionIndex: number }
  | { kind: 'customs'; milestones: Milestone[]; holds: CustomsHold[]; sectionIndex: number }

export const CUSTOMS_PLACE_LABEL = 'Customs'

export function transitSections(legs: Leg[], timeline: Timeline): TransitSection[] {
  const sections: TransitSection[] = []
  for (const milestone of timeline.milestones) {
    const last = sections.at(-1)
    if (last && sectionLegId(last) === milestone.legId) {
      last.milestones.push(milestone)
      continue
    }
    const section = openSection(milestone, legs, timeline.customsHolds)
    if (section) sections.push(section)
  }
  return sections
}

function sectionLegId(section: TransitSection): string | null {
  return section.kind === 'leg' ? section.leg.id : null
}

function openSection(
  milestone: Milestone,
  legs: Leg[],
  holds: CustomsHold[],
): TransitSection | null {
  if (milestone.legId === null) return { kind: 'customs', milestones: [milestone], holds }
  const leg = legs.find((candidate) => candidate.id === milestone.legId)
  return leg ? { kind: 'leg', leg, milestones: [milestone] } : null
}

// BR-MS-04: `not_reported` is shown as passed, never as confirmed.
export function isPassed(state: MilestoneState): boolean {
  return state === 'done' || state === 'not_reported'
}

// SC-04: no marker when booked, the final stop when delivered, otherwise the latest done
// milestone in plan order (BR-MS-06).
export function currentMilestoneId(status: ShipmentStatus, timeline: Timeline): string | null {
  if (status === 'booked') return null
  if (status === 'delivered') return timeline.milestones.at(-1)?.id ?? null
  const done = timeline.milestones.filter((milestone) => milestone.state === 'done')
  return done.at(-1)?.id ?? null
}

export function transitStops(sections: TransitSection[]): TransitStop[] {
  return sections.flatMap((section, sectionIndex): TransitStop[] => {
    if (section.kind === 'customs') {
      const { milestones, holds } = section
      return [{ kind: 'customs', milestones, holds, sectionIndex }]
    }
    return section.milestones.map((milestone) => ({ kind: 'milestone', milestone, sectionIndex }))
  })
}

export function stopMilestones(stop: TransitStop): Milestone[] {
  return stop.kind === 'customs' ? stop.milestones : [stop.milestone]
}

// The customs stop reads as its last passed milestone, or overdue/pending before that.
export function stopState(stop: TransitStop): MilestoneState {
  const milestones = stopMilestones(stop)
  const last = milestones.at(-1)
  if (last && isPassed(last.state)) return last.state
  if (milestones.some((milestone) => milestone.state === 'overdue')) return 'overdue'
  return 'pending'
}

// BR-MS-05.
export function hasOpenHold(holds: CustomsHold[]): boolean {
  return holds.some((hold) => hold.open)
}

// SC-04 compact variant: share of a section already travelled.
export function sectionProgress(section: TransitSection): number {
  const passed = section.milestones.filter((milestone) => isPassed(milestone.state)).length
  return section.milestones.length === 0 ? 0 : passed / section.milestones.length
}

// SC-04: place labels at leg boundaries: the origin, then where each section ends.
export function sectionEndPlace(section: TransitSection): string {
  return section.kind === 'customs' ? CUSTOMS_PLACE_LABEL : section.leg.to
}
