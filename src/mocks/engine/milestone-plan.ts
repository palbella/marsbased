import type { MilestoneType } from '@/domain'
import type { LegRow } from '@/mocks/db/tables/legs'
import { addHours, hoursBetween } from './time'

// BR-MS-03: planned offsets, in hours, from the leg dates they hang off.
const PICKUP_BEFORE_DEPARTURE_HOURS = 2
const LOADING_BEFORE_DEPARTURE_HOURS = 12
const DISCHARGE_AFTER_ARRIVAL_HOURS = 12
const CLEARANCE_AFTER_ARRIVAL_HOURS = 24
const OUT_FOR_DELIVERY_BEFORE_ARRIVAL_HOURS = 6
// On a short leg, out for delivery is capped at half its duration so it never comes before
// the departure.
const OUT_FOR_DELIVERY_MAX_SHARE_OF_LEG = 0.5

// BR-MS-02: countries of the EU customs union; anything else needs customs.
const EU_CUSTOMS_UNION = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU',
  'IE', 'IT', 'LT', 'LU', 'LV', 'MC', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
]) // prettier-ignore

export interface PlannedMilestone {
  // Stable per leg and type, e.g. `ms_leg_015_2_vessel_departed`.
  id: string
  // The leg it counts towards; customs milestones belong to the sea leg (BR-MS-06).
  legId: string
  type: MilestoneType
  // BR-MS-02: part of the customs block between the sea leg and the last mile.
  customs: boolean
  plannedAt: string
}

type LegKind = 'road_only' | 'road_to_port' | 'sea' | 'last_mile'

export function needsCustoms(destinationCountry: string): boolean {
  return !EU_CUSTOMS_UNION.has(destinationCountry)
}

// BR-MS-01: the milestones of every leg, in plan order.
export function planMilestones(legs: LegRow[], destinationCountry: string): PlannedMilestone[] {
  const withCustoms = needsCustoms(destinationCountry)
  return legs.flatMap((leg, index) => {
    const kind = legKind(leg, legs[index - 1], legs[index + 1])
    const milestones = legMilestones(kind, leg)
    // 07 only has non-EU destinations by sea, so customs always follows a sea leg.
    if (kind === 'sea' && withCustoms) milestones.push(...customsMilestones(leg))
    return milestones
  })
}

function legKind(leg: LegRow, previous?: LegRow, next?: LegRow): LegKind {
  if (leg.mode === 'sea') return 'sea'
  if (next?.mode === 'sea') return 'road_to_port'
  if (previous?.mode === 'sea') return 'last_mile'
  return 'road_only'
}

function legMilestones(kind: LegKind, leg: LegRow): PlannedMilestone[] {
  const { plannedDeparture: departure, plannedArrival: arrival } = leg
  const pickedUp = milestone(leg, 'picked_up', addHours(departure, -PICKUP_BEFORE_DEPARTURE_HOURS))
  const outForDelivery = milestone(leg, 'out_for_delivery', outForDeliveryAt(leg))
  const delivered = milestone(leg, 'delivered', arrival)

  switch (kind) {
    case 'road_only':
      return [pickedUp, milestone(leg, 'departed_site', departure), outForDelivery, delivered]
    case 'road_to_port':
      return [
        pickedUp,
        milestone(leg, 'departed_site', departure),
        milestone(leg, 'arrived_port', arrival),
      ]
    case 'sea':
      return [
        milestone(leg, 'loaded_on_vessel', addHours(departure, -LOADING_BEFORE_DEPARTURE_HOURS)),
        milestone(leg, 'vessel_departed', departure),
        milestone(leg, 'vessel_arrived', arrival),
        milestone(leg, 'discharged', addHours(arrival, DISCHARGE_AFTER_ARRIVAL_HOURS)),
      ]
    case 'last_mile':
      return [pickedUp, outForDelivery, delivered]
  }
}

// BR-MS-03: last leg arrival − min(6 h, half the leg's planned duration).
function outForDeliveryAt({ plannedDeparture, plannedArrival }: LegRow): string {
  const legHours = hoursBetween(plannedDeparture, plannedArrival)
  const lead = Math.min(
    OUT_FOR_DELIVERY_BEFORE_ARRIVAL_HOURS,
    legHours * OUT_FOR_DELIVERY_MAX_SHARE_OF_LEG,
  )
  return addHours(plannedArrival, -lead)
}

function customsMilestones(seaLeg: LegRow): PlannedMilestone[] {
  const arrival = seaLeg.plannedArrival
  return [
    { ...milestone(seaLeg, 'customs_submitted', arrival), customs: true },
    {
      ...milestone(seaLeg, 'customs_cleared', addHours(arrival, CLEARANCE_AFTER_ARRIVAL_HOURS)),
      customs: true,
    },
  ]
}

function milestone(leg: LegRow, type: MilestoneType, plannedAt: string): PlannedMilestone {
  return { id: `ms_${leg.id}_${type}`, legId: leg.id, type, customs: false, plannedAt }
}
