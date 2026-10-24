import type { Shipment, Timeline } from '@/domain'
import { CompactTransitLine } from './compact-transit-line'
import { FullTransitLine } from './full-transit-line'

// SC-04: compact in list rows (the shipment alone), full in the detail (with its timeline).
type TransitLineProps =
  | { variant: 'compact'; shipment: Shipment; className?: string }
  | { variant: 'full'; shipment: Shipment; timeline: Timeline; className?: string }

export function TransitLine(props: TransitLineProps) {
  if (props.variant === 'compact') {
    return <CompactTransitLine shipment={props.shipment} className={props.className} />
  }
  return (
    <FullTransitLine
      shipment={props.shipment}
      timeline={props.timeline}
      className={props.className}
    />
  )
}
