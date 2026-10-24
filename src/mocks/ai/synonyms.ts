import type { MappingTarget } from '@/domain'

// BR-AI-04, 07 §3 "AI-4 synonyms": how operators tend to word each target. Lower case, no
// accents or punctuation, as compared after normalisation.
export const SYNONYMS: Record<MappingTarget, string[]> = {
  picked_up: ['picked up', 'pickup', 'collected', 'collected at port', 'loaded at origin'],
  departed_site: ['departed', 'departed site', 'left warehouse', 'left the plant', 'dispatched'],
  arrived_port: ['arrived at port', 'gate in', 'arrived at terminal', 'port arrival'],
  loaded_on_vessel: ['loaded on vessel', 'loaded on board', 'container loaded'],
  vessel_departed: ['vessel departed', 'sailed', 'vessel sailed', 'left port'],
  vessel_arrived: ['vessel arrived', 'arrived at destination port', 'berthed'],
  discharged: ['discharged', 'unloaded from vessel', 'container discharged'],
  customs_submitted: ['customs submitted', 'declaration filed', 'customs declaration lodged'],
  customs_cleared: ['customs cleared', 'customs released', 'cleared customs'],
  customs_hold: ['customs hold', 'held by customs', 'customs inspection'],
  out_for_delivery: ['out for delivery', 'on delivery route', 'with courier'],
  delivered: ['delivered', 'handed to recipient', 'handed to customer', 'proof of delivery', 'pod'],
  eta_update: ['new eta', 'eta update', 'estimated arrival', 'revised arrival'],
  position_update: ['position', 'gps ping', 'location update', 'scan'],
  ignore: ['information', 'note', 'comment'],
}
