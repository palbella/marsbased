import type { OnTimeIndicator, ShipmentStatus } from '@/domain'
import type { LegRow } from '@/mocks/db/tables/legs'
import { deriveEta, type EtaView } from './eta'
import type { ShipmentFacts } from './facts'
import { needsCustoms, planMilestones } from './milestone-plan'
import { deriveOnTime } from './on-time'
import { predictEta, type EtaPrediction } from './predicted-eta'
import { computeStaleness, type Staleness } from './staleness'
import { deriveCurrentLeg, deriveStatus, latestDone } from './status'
import { hoursBetween } from './time'
import {
  bookingTime,
  buildTimeline,
  customsHolds,
  type CustomsHoldView,
  type MilestoneView,
} from './timeline'

// 02 §5.5 rule 4: everything derived from a shipment's facts at `now`, as a backend view
// would. T05's mappers turn it into API responses.
export interface ShipmentView {
  shipmentId: string
  // Plan order (BR-MS-01).
  milestones: MilestoneView[]
  holds: CustomsHoldView[]
  latestDone: MilestoneView | null
  currentLeg: LegRow
  status: ShipmentStatus
  eta: EtaView
  // `ETA − plannedEta`, in hours (BR-OT-01).
  etaDeltaHours: number
  // BR-ETA-06: separate from the ETA; none once delivered, as nothing is left to predict.
  prediction: EtaPrediction | null
  onTime: OnTimeIndicator
  lastEventAt: string | null
  staleness: Staleness
  // BR-MS-02.
  hasCustoms: boolean
  international: boolean
  delivered: boolean
}

export function deriveShipment(facts: ShipmentFacts, now: Date): ShipmentView {
  const { shipment, legs, events } = facts
  const bookedAt = bookingTime(legs)
  const milestones = buildTimeline(
    planMilestones(legs, shipment.destinationCountry),
    events,
    bookedAt,
    now,
  )
  const holds = customsHolds(events)
  const status = deriveStatus(milestones, holds)
  const currentLeg = deriveCurrentLeg(legs, milestones)
  // BR-SL-02, BR-NM-03: every event counts, mapped or not.
  const lastEventAt = events.at(-1)?.occurredAt ?? null
  const staleness = computeStaleness(status, currentLeg.mode, lastEventAt, now)
  const outlook = deriveOutlook(facts, { milestones, bookedAt, status, currentLeg, staleness }, now)
  return {
    shipmentId: shipment.id,
    milestones,
    holds,
    latestDone: latestDone(milestones),
    currentLeg,
    status,
    ...outlook,
    lastEventAt,
    staleness,
    hasCustoms: needsCustoms(shipment.destinationCountry),
    international: shipment.destinationCountry !== facts.originSite.country,
    delivered: status === 'delivered',
  }
}

interface Progress {
  milestones: MilestoneView[]
  bookedAt: string
  status: ShipmentStatus
  currentLeg: LegRow
  staleness: Staleness
}

// BR-ETA, BR-AI-05 and BR-OT: when it arrives and whether that is on time.
function deriveOutlook(facts: ShipmentFacts, progress: Progress, now: Date) {
  const { legs, events, shipment, operators } = facts
  const { milestones, bookedAt, status, currentLeg, staleness } = progress
  const plannedEta = shipment.plannedEta
  const outdated = staleness.veryStale
  const eta = deriveEta({ legs, milestones, events, plannedEta, bookedAt, outdated })
  const delivered = status === 'delivered'
  const prediction = delivered
    ? null
    : predictEta({
        legs,
        operators,
        currentLegId: currentLeg.id,
        eta: eta.value,
        stale: staleness.stale,
        now,
      })
  const deliveredAt = delivered ? eta.value : null
  return {
    eta,
    etaDeltaHours: hoursBetween(plannedEta, eta.value),
    prediction,
    onTime: deriveOnTime({ eta, plannedEta, deliveredAt, prediction, now }),
  }
}
