import type { MilestoneType } from '@/domain'
import type { LegRow } from '@/mocks/db/tables/legs'

// BR-AI-01: where the shipment is, after each milestone, in customer terms. Every place and
// vessel name comes from the leg (P1).
export function positionAfter(type: MilestoneType, leg: LegRow): string {
  const vessel = leg.vessel ?? 'vessel'
  switch (type) {
    case 'picked_up':
      return `has been picked up in ${leg.from}`
    case 'departed_site':
      return `is on the road from ${leg.from} to ${leg.to}`
    case 'arrived_port':
    case 'vessel_arrived':
      return `has arrived at ${leg.to}`
    case 'loaded_on_vessel':
      return `has been loaded on the ${vessel} at ${leg.from}`
    case 'vessel_departed':
      return `is on board the ${vessel} to ${leg.to}`
    case 'discharged':
      return `has been unloaded at ${leg.to}`
    case 'customs_submitted':
    case 'customs_hold':
      return 'is going through customs'
    case 'customs_cleared':
      return 'has cleared customs'
    case 'out_for_delivery':
      return `is out for delivery in ${leg.to}`
    case 'delivered':
      return `was delivered in ${leg.to}`
  }
}

// BR-AI-01: the next milestone, as a short noun phrase.
export function nextStepName(type: MilestoneType, leg: LegRow): string {
  switch (type) {
    case 'picked_up':
      return `pickup in ${leg.from}`
    case 'departed_site':
      return `departure from ${leg.from}`
    case 'arrived_port':
    case 'vessel_arrived':
      return `arrival at ${leg.to}`
    case 'loaded_on_vessel':
      return `loading on the ${leg.vessel ?? 'vessel'}`
    case 'vessel_departed':
      return `departure from ${leg.from}`
    case 'discharged':
      return `unloading at ${leg.to}`
    case 'customs_submitted':
      return 'customs submission'
    case 'customs_cleared':
    case 'customs_hold':
      return 'customs clearance'
    case 'out_for_delivery':
      return `out for delivery in ${leg.to}`
    case 'delivered':
      return `delivery in ${leg.to}`
  }
}
