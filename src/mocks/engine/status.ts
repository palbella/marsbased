import type { MilestoneType, ShipmentStatus } from '@/domain'
import type { LegRow } from '@/mocks/db/tables/legs'
import type { Legs } from './facts'
import type { CustomsHoldView, MilestoneView } from './timeline'

// BR-ST-01: status by the latest done milestone. `customs_hold` is a timeline entry, not a
// milestone of the plan (BR-MS-05), so it never is the latest done one.
const STATUS_BY_MILESTONE: Record<Exclude<MilestoneType, 'customs_hold'>, ShipmentStatus> = {
  picked_up: 'in_transit',
  departed_site: 'in_transit',
  vessel_departed: 'in_transit',
  arrived_port: 'at_port',
  loaded_on_vessel: 'at_port',
  vessel_arrived: 'at_port',
  discharged: 'at_port',
  customs_cleared: 'at_port',
  customs_submitted: 'in_customs',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
}

// The latest done milestone in plan order.
export function latestDone(milestones: MilestoneView[]): MilestoneView | null {
  return milestones.findLast((milestone) => milestone.state === 'done') ?? null
}

export function deriveStatus(
  milestones: MilestoneView[],
  holds: CustomsHoldView[],
): ShipmentStatus {
  // BR-ST-02.
  if (holds.some((hold) => hold.open)) return 'on_hold'
  const latest = latestDone(milestones)
  if (!latest || latest.type === 'customs_hold') return 'booked'
  return STATUS_BY_MILESTONE[latest.type]
}

// BR-MS-06. Customs milestones belong to the sea leg, so it stays current until clearance.
export function deriveCurrentLeg(legs: Legs, milestones: MilestoneView[]): LegRow {
  const latest = latestDone(milestones)
  if (!latest) return legs[0]
  const index = legs.findIndex((leg) => leg.id === latest.legId)
  const ofLeg = milestones.filter((milestone) => milestone.legId === latest.legId)
  const isLastOfLeg = ofLeg.at(-1)?.id === latest.id
  return (isLastOfLeg ? legs[index + 1] : undefined) ?? legs[index] ?? legs[0]
}
