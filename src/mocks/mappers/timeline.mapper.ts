import type { Milestone, Timeline } from '@/domain'
import type { ShipmentView } from '@/mocks/engine/shipment-view'
import type { MilestoneView } from '@/mocks/engine/timeline'

// BR-PM-04: customer-safe by construction. The timeline carries dates, provenance and the
// raw event id only; raw payloads, notes and operator contacts live behind ops-only endpoints.
export function toTimelineResponse(view: ShipmentView): Timeline {
  return {
    shipmentId: view.shipmentId,
    milestones: view.milestones.map(toMilestoneResponse),
    customsHolds: view.holds.map((hold) => ({
      id: hold.id,
      reportedAt: hold.reportedAt,
      open: hold.open,
      rawEventId: hold.rawEventId,
    })),
  }
}

function toMilestoneResponse(milestone: MilestoneView): Milestone {
  return {
    id: milestone.id,
    // The customs block sits between legs (BR-MS-02).
    legId: milestone.customs ? null : milestone.legId,
    type: milestone.type,
    state: milestone.state,
    planned: milestone.planned,
    ...(milestone.actual ? { actual: milestone.actual } : {}),
    ...(milestone.rawEventId ? { rawEventId: milestone.rawEventId } : {}),
  }
}
