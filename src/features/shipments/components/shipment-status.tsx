import {
  Anchor,
  CalendarClock,
  CircleCheck,
  MoveRight,
  OctagonPause,
  PackageCheck,
  Stamp as StampIcon,
  type LucideIcon,
} from 'lucide-react'
import { shipmentStatusLabels, type ShipmentStatus as ShipmentStatusValue } from '@/domain'
import { Stamp, type StampTone } from '@/components/ui/stamp'
import { cn } from '@/lib/utils'

const statusIcons: Record<ShipmentStatusValue, LucideIcon> = {
  booked: CalendarClock,
  in_transit: MoveRight,
  at_port: Anchor,
  in_customs: StampIcon,
  on_hold: OctagonPause,
  out_for_delivery: PackageCheck,
  delivered: CircleCheck,
}

// DS-10: terminal and blocking states deserve a pause.
const stampTones: Partial<Record<ShipmentStatusValue, StampTone>> = {
  delivered: 'ok',
  on_hold: 'late',
}

interface ShipmentStatusProps {
  status: ShipmentStatusValue
  // SC-01: the detail header stamps `DELIVERED` and `ON HOLD`.
  stamped?: boolean
  className?: string
}

// SC-01: condensed uppercase status with its icon; the word always carries the meaning.
export function ShipmentStatus({ status, stamped = false, className }: ShipmentStatusProps) {
  const label = shipmentStatusLabels[status]
  const tone = stampTones[status]
  if (stamped && tone) {
    return (
      <Stamp tone={tone} className={cn('text-base', className)}>
        {label}
      </Stamp>
    )
  }
  const Icon = statusIcons[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-condensed text-sm font-semibold tracking-wider whitespace-nowrap text-ink uppercase',
        className,
      )}
    >
      <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.5} />
      {label}
    </span>
  )
}
