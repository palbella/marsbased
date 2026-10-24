import type { MilestoneState, SourcedDate } from '@/domain'
import type { Legs } from './facts'
import type { NormalisedEvent } from '@/mocks/operators/normalise'
import type { PlannedMilestone } from './milestone-plan'
import { addHours, hoursBetween, isAfter } from './time'

// BR-MS-04: a planned milestone becomes overdue this long after its planned date.
const OVERDUE_AFTER_HOURS = 2
// BR-ETA-04: the booking is taken to be made two days before the first leg departs.
const BOOKING_BEFORE_DEPARTURE_HOURS = 48

export const BOOKING_SOURCE = 'booking'

export interface MilestoneView extends PlannedMilestone {
  state: MilestoneState
  planned: SourcedDate
  actual: SourcedDate | null
  // BR-NM-05.
  rawEventId: string | null
}

export interface CustomsHoldView {
  id: string
  rawEventId: string
  reportedAt: SourcedDate
  // BR-MS-05: open until a later `customs_cleared` arrives.
  open: boolean
}

export function bookingTime(legs: Legs): string {
  return addHours(legs[0].plannedDeparture, -BOOKING_BEFORE_DEPARTURE_HOURS)
}

// BR-MS-04, BR-NM-02/05/06: fills each planned milestone from the first event that reports it.
export function buildTimeline(
  plan: PlannedMilestone[],
  events: NormalisedEvent[],
  bookedAt: string,
  now: Date,
): MilestoneView[] {
  const firstReports = firstReportByMilestone(events)
  const filled = plan.map((milestone) => {
    // Out-of-plan events match no planned milestone (BR-NM-06).
    const event = firstReports.get(`${milestone.legId}|${milestone.type}`)
    return {
      ...milestone,
      planned: sourced(milestone.plannedAt, 'estimated', BOOKING_SOURCE, bookedAt),
      actual: event ? actualOf(event) : null,
      rawEventId: event?.rawEventId ?? null,
    }
  })
  return filled.map((milestone, index) => ({
    ...milestone,
    state: milestoneState(milestone, filled.slice(index + 1), now),
  }))
}

// Events are in `occurredAt` order, so the first one per leg and target is what happened.
function firstReportByMilestone(events: NormalisedEvent[]): Map<string, NormalisedEvent> {
  const reports = new Map<string, NormalisedEvent>()
  for (const event of events) {
    const key = `${event.legId}|${event.target}`
    if (!reports.has(key)) reports.set(key, event)
  }
  return reports
}

// BR-MS-05.
export function customsHolds(events: NormalisedEvent[]): CustomsHoldView[] {
  const clearances = events.filter((event) => event.target === 'customs_cleared')
  return events
    .filter((event) => event.target === 'customs_hold')
    .map((hold) => ({
      id: `hold_${hold.rawEventId}`,
      rawEventId: hold.rawEventId,
      reportedAt: actualOf(hold),
      open: !clearances.some((clearance) => isAfter(clearance.occurredAt, hold.occurredAt)),
    }))
}

function milestoneState(
  milestone: { actual: SourcedDate | null; plannedAt: string },
  later: { actual: SourcedDate | null }[],
  now: Date,
): MilestoneState {
  if (milestone.actual) return 'done'
  if (later.some((next) => next.actual)) return 'not_reported'
  if (hoursBetween(milestone.plannedAt, now) > OVERDUE_AFTER_HOURS) return 'overdue'
  return 'pending'
}

// BR-NM-02: what happened is `confirmed`; an operator estimate is `estimated`.
function actualOf(event: NormalisedEvent): SourcedDate {
  const provenance = event.isEstimate ? 'estimated' : 'confirmed'
  return sourced(event.occurredAt, provenance, event.operatorId, event.receivedAt)
}

function sourced(
  value: string,
  provenance: SourcedDate['provenance'],
  source: string,
  observedAt: string,
): SourcedDate {
  return { value, provenance, source, observedAt }
}
