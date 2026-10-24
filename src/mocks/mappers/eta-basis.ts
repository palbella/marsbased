import type { MilestoneType } from '@/domain'
import { formatDuration, operatorName } from '@/mocks/ai/format'
import { SYSTEM_SOURCE, type EtaView } from '@/mocks/engine/eta'
import type { LegRow } from '@/mocks/db/tables/legs'
import type { ShipmentFacts } from '@/mocks/engine/facts'
import type { ShipmentView } from '@/mocks/engine/shipment-view'
import { hoursBetween } from '@/mocks/engine/time'

// SC-03, 02 §6.2: what our estimate is based on, in customer terms (no codes, no contacts).
// Only system estimates explain themselves: booking, operator and confirmed dates already
// name their source in the tooltip.
export function etaBasis(
  eta: EtaView,
  { facts, view }: { facts: ShipmentFacts; view: ShipmentView },
  now: Date,
): string | null {
  if (eta.source !== SYSTEM_SOURCE || eta.rawEventId === null) return null
  const event = facts.events.find((candidate) => candidate.rawEventId === eta.rawEventId)
  if (!event) return null
  if (event.target === 'eta_update') return operatorUpdateBasis(event, facts, now)
  return milestoneDelayBasis(view, facts)
}

// BR-ETA-03: an earlier leg's operator moved its own arrival.
function operatorUpdateBasis(
  event: ShipmentFacts['events'][number],
  facts: ShipmentFacts,
  now: Date,
): string | null {
  const leg = facts.legs.find((candidate) => candidate.id === event.legId)
  if (!leg) return null
  const arrival = leg.mode === 'sea' ? 'vessel arrival' : `arrival at ${leg.to}`
  const ago = formatDuration(hoursBetween(event.occurredAt, now))
  return `${operatorName(facts, event.operatorId)} moved the ${arrival} ${ago} ago`
}

// BR-ETA-04: the delay of the latest done milestone, carried to the committed date.
function milestoneDelayBasis(view: ShipmentView, facts: ShipmentFacts): string | null {
  const latest = view.latestDone
  const leg = facts.legs.find((candidate) => candidate.id === latest?.legId)
  if (!latest?.actual || !leg) return null
  const delayHours = hoursBetween(latest.plannedAt, latest.actual.value)
  const happened = whatHappened[latest.type](leg)
  if (delayHours <= 0) return `${happened} on schedule`
  return `${happened} ${formatDuration(delayHours)} late`
}

// Each milestone as it reads in "…, based on the vessel departed Valencia 18 h late".
const whatHappened: Record<MilestoneType, (leg: LegRow) => string> = {
  picked_up: (leg) => `the goods were picked up in ${leg.from}`,
  departed_site: (leg) => `the truck left ${leg.from}`,
  arrived_port: (leg) => `the truck reached ${leg.to}`,
  loaded_on_vessel: (leg) => `the goods were loaded on the ${leg.vessel ?? 'vessel'}`,
  vessel_departed: (leg) => `the vessel departed ${leg.from}`,
  vessel_arrived: (leg) => `the vessel arrived at ${leg.to}`,
  discharged: (leg) => `the goods were unloaded at ${leg.to}`,
  customs_submitted: () => 'the customs declaration was submitted',
  customs_cleared: () => 'customs cleared the goods',
  customs_hold: () => 'customs held the goods',
  out_for_delivery: (leg) => `the goods went out for delivery in ${leg.to}`,
  delivered: (leg) => `the goods were delivered in ${leg.to}`,
}
