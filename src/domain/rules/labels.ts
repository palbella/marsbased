import type { AiInsightKind } from '../ai'
import type { DocumentStatus, DocumentType } from '../document'
import type { Perimeter, Role } from '../org'
import type { Mode } from '../primitives'
import type { OnTimeIndicator, ShipmentStatus } from '../shipment'
import type { MilestoneState, MilestoneType } from '../timeline'

// Glossary names (01 §4), the same in the user menu, profile and test accounts.
export const roleLabels: Record<Role, string> = {
  customer: 'Customer',
  ops_agent: 'Ops agent',
  ops_manager: 'Ops manager',
}

// UI-08: account name for customers; sites, or "All sites" for managers.
export function perimeterLabel(perimeter: Perimeter): string {
  if (perimeter.kind === 'account') return perimeter.account.name
  if (perimeter.kind === 'all') return 'All sites'
  return perimeter.sites.map((site) => site.name).join(', ')
}

// UI-08: the field label above the perimeter in the profile.
export function perimeterFieldLabel(perimeter: Perimeter): string {
  return perimeter.kind === 'account' ? 'Account' : 'Sites'
}

// SC-01: glossary names; the UI prints them uppercase.
export const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  booked: 'Booked',
  in_transit: 'In transit',
  at_port: 'At port',
  in_customs: 'In customs',
  on_hold: 'On hold',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
}

// SC-02.
export const onTimeLabels: Record<OnTimeIndicator, string> = {
  on_time: 'On time',
  at_risk: 'At risk',
  late: 'Late',
  unknown: 'Unknown',
}

// SC-03: the sentence case of the milestone type.
export const milestoneLabels: Record<MilestoneType, string> = {
  picked_up: 'Picked up',
  departed_site: 'Departed site',
  arrived_port: 'Arrived at port',
  loaded_on_vessel: 'Loaded on vessel',
  vessel_departed: 'Vessel departed',
  vessel_arrived: 'Vessel arrived',
  discharged: 'Discharged',
  customs_submitted: 'Customs submitted',
  customs_cleared: 'Customs cleared',
  customs_hold: 'Customs hold',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
}

// SC-05, BR-MS-04.
export const milestoneStateLabels: Record<MilestoneState, string> = {
  done: 'Done',
  not_reported: 'Not reported by operator',
  overdue: 'Overdue',
  pending: 'Pending',
}

export const modeLabels: Record<Mode, string> = {
  road: 'Road',
  sea: 'Sea',
}

// SC-08.
export const documentTypeLabels: Record<DocumentType, string> = {
  cmr: 'CMR',
  bill_of_lading: 'Bill of lading',
  commercial_invoice: 'Commercial invoice',
  packing_list: 'Packing list',
  customs_declaration: 'Customs declaration',
  proof_of_delivery: 'Proof of delivery',
}

export const documentStatusLabels: Record<DocumentStatus, string> = {
  available: 'Available',
  pending: 'Pending',
}

// SC-06: the kind in the analyst-note header.
export const insightKindLabels: Record<AiInsightKind, string> = {
  summary: 'Summary',
  eta_prediction: 'ETA prediction',
  priority: 'Priority',
  draft: 'Draft message',
  mapping: 'Mapping suggestion',
}
