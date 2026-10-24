import type { Eta, MilestoneType } from '@/domain'
import type { LegRow } from '@/mocks/db/tables/legs'
import type { NormalisedEvent } from '@/mocks/operators/normalise'
import { latestDone } from './status'
import { addHours, hoursBetween } from './time'
import { BOOKING_SOURCE, type MilestoneView } from './timeline'

export const SYSTEM_SOURCE = 'system'

// The ETA as the engine derives it; the API adds its `basis` sentence (shipment mapper).
export type EtaView = Omit<Eta, 'basis'>

// The milestone planned at each leg's arrival (BR-MS-03), which ends BR-ETA-03.
const ARRIVAL_MILESTONES: MilestoneType[] = ['arrived_port', 'vessel_arrived', 'delivered']

export interface EtaInput {
  legs: LegRow[]
  milestones: MilestoneView[]
  events: NormalisedEvent[]
  plannedEta: string
  bookedAt: string
  // BR-ETA-05: very stale.
  outdated: boolean
}

// BR-ETA-01..05: the first rule that applies wins; every ETA keeps its source (P1).
export function deriveEta(input: EtaInput): EtaView {
  const eta = delivered(input) ?? lastLegEstimate(input) ?? earlierLegEstimate(input)
  return { ...(eta ?? systemEstimate(input)), outdated: input.outdated }
}

type EtaValue = Omit<EtaView, 'outdated'>

// BR-ETA-01.
function delivered({ milestones }: EtaInput): EtaValue | null {
  const milestone = milestones.find((candidate) => candidate.type === 'delivered')
  if (!milestone?.actual) return null
  return { ...milestone.actual, provenance: 'confirmed', rawEventId: milestone.rawEventId }
}

// BR-ETA-02: the latest ETA update from the last leg's operator.
function lastLegEstimate({ legs, events }: EtaInput): EtaValue | null {
  const lastLeg = legs.at(-1)
  const update = events.findLast(
    (event) => event.target === 'eta_update' && event.legId === lastLeg?.id && event.eta,
  )
  if (!update?.eta) return null
  return {
    value: update.eta,
    provenance: 'estimated',
    source: update.operatorId,
    observedAt: update.occurredAt,
    rawEventId: update.rawEventId,
  }
}

// BR-ETA-03: an earlier leg's new arrival carries its difference forward, until that leg's
// arrival milestone is done.
function earlierLegEstimate({ legs, milestones, events, plannedEta }: EtaInput): EtaValue | null {
  const arrived = (legId: string) =>
    milestones.some(
      (milestone) =>
        milestone.legId === legId &&
        ARRIVAL_MILESTONES.includes(milestone.type) &&
        milestone.state === 'done',
    )
  const earlierLegs = legs.slice(0, -1).filter((leg) => !arrived(leg.id))
  const update = events.findLast(
    (event) =>
      event.target === 'eta_update' &&
      event.eta &&
      earlierLegs.some((leg) => leg.id === event.legId),
  )
  const leg = earlierLegs.find((candidate) => candidate.id === update?.legId)
  if (!update?.eta || !leg) return null
  return {
    value: addHours(plannedEta, hoursBetween(leg.plannedArrival, update.eta)),
    provenance: 'estimated',
    source: SYSTEM_SOURCE,
    observedAt: update.occurredAt,
    rawEventId: update.rawEventId,
  }
}

// BR-ETA-04: the delay of the latest done milestone, carried to the committed date.
function systemEstimate({ milestones, plannedEta, bookedAt }: EtaInput): EtaValue {
  const latest = latestDone(milestones)
  if (!latest?.actual) {
    return {
      value: plannedEta,
      provenance: 'estimated',
      source: BOOKING_SOURCE,
      observedAt: bookedAt,
      rawEventId: null,
    }
  }
  const delayHours = Math.max(0, hoursBetween(latest.plannedAt, latest.actual.value))
  return {
    value: addHours(plannedEta, delayHours),
    provenance: 'estimated',
    source: SYSTEM_SOURCE,
    observedAt: latest.actual.observedAt,
    rawEventId: latest.rawEventId,
  }
}
