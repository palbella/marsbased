import type { Shipment } from '../shipment'
import type { MilestoneType } from '../timeline'
import { CUSTOMS_PLACE_LABEL } from './transit'

// SC-04 compact variant: one stop per place, drawn from the shipment alone so list rows
// need no timeline.

// BR-MS-01: the milestone that closes each kind of section.
const SECTION_END_MILESTONES: ReadonlySet<MilestoneType> = new Set([
  'arrived_port',
  'discharged',
  'customs_cleared',
  'delivered',
])

export interface CompactSection {
  // null for the customs block.
  legId: string | null
  endPlace: string
}

export interface CompactRoute {
  origin: string
  sections: CompactSection[]
  // Where the `--signal` square sits: mid-section while moving, or on the section's end place.
  marker: { sectionIndex: number; atEnd: boolean } | null
}

export type SectionFill = 'solid' | 'partial' | 'dashed'

type RouteFacts = Pick<Shipment, 'legs' | 'status' | 'hasCustoms' | 'lastDoneMilestone'>

export function compactRoute(shipment: RouteFacts): CompactRoute {
  const sections = compactSections(shipment)
  return {
    origin: shipment.legs[0]?.from ?? '',
    sections,
    marker: compactMarker(shipment, sections),
  }
}

// BR-MS-02: customs sits right after the sea leg, before the last mile.
function compactSections({ legs, hasCustoms }: RouteFacts): CompactSection[] {
  return legs.flatMap((leg) => {
    const section = { legId: leg.id, endPlace: leg.to }
    if (!hasCustoms || leg.mode !== 'sea') return [section]
    return [section, { legId: null, endPlace: CUSTOMS_PLACE_LABEL }]
  })
}

// SC-04: none when booked, the final stop when delivered, otherwise the latest done milestone.
function compactMarker(shipment: RouteFacts, sections: CompactSection[]): CompactRoute['marker'] {
  const last = shipment.lastDoneMilestone
  if (shipment.status === 'booked' || last === null) return null
  if (shipment.status === 'delivered') return { sectionIndex: sections.length - 1, atEnd: true }
  const sectionIndex = sections.findIndex((section) => section.legId === last.legId)
  if (sectionIndex < 0) return null
  return { sectionIndex, atEnd: SECTION_END_MILESTONES.has(last.type) }
}

// Solid behind the marker, dashed ahead of it (DS-04).
export function sectionFill(route: CompactRoute, sectionIndex: number): SectionFill {
  const { marker } = route
  if (marker === null || sectionIndex > marker.sectionIndex) return 'dashed'
  if (sectionIndex < marker.sectionIndex || marker.atEnd) return 'solid'
  return 'partial'
}
