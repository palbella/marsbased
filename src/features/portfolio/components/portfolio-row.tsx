'use client'

import Link from 'next/link'
import type { Shipment } from '@/domain'
import {
  OnTimeIndicator,
  ShipmentStatus,
  SourcedDate,
  TransitLine,
  operatorNames,
} from '@/features/shipments'
import { cn } from '@/lib/utils'

// OP-20 columns on desktop; OP-23 below 768 px: two ruled lines, reference, ETA and on-time
// first, then the compact transit line and the status. The cells are grid items on mobile and
// table cells on desktop, so one row serves both.
const cell = 'px-3 py-2 align-middle md:table-cell'
const desktopOnly = 'hidden md:table-cell'

export function PortfolioRow({ shipment }: { shipment: Shipment }) {
  const { destination } = shipment
  return (
    <tr className="relative grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 border-b border-rule px-1 py-1 hover:bg-paper md:table-row md:p-0">
      <td className={cn(cell, 'order-1 font-mono text-sm font-medium whitespace-nowrap')}>
        <Link href={`/ops/shipments/${shipment.id}`} className="after:absolute after:inset-0">
          {shipment.reference}
        </Link>
      </td>
      <td className={cn(cell, desktopOnly, 'text-sm')}>{shipment.accountName}</td>
      <td className={cn(cell, desktopOnly, 'text-sm')}>{shipment.originSiteName}</td>
      <td className={cn(cell, desktopOnly, 'text-sm')}>
        {destination.city}, {destination.country}
      </td>
      <td className={cn(cell, 'order-4 min-w-0')}>
        <TransitLine
          variant="compact"
          shipment={shipment}
          className="w-full max-w-48 md:min-w-32"
        />
      </td>
      <td className={cn(cell, 'order-5 col-span-2 text-right md:text-left')}>
        <ShipmentStatus status={shipment.status} className="text-xs" />
      </td>
      <td className={cn(cell, 'order-3')}>
        <OnTimeIndicator shipment={shipment} className="relative z-10" />
      </td>
      <td className={cn(cell, 'order-2 min-w-0 font-mono text-sm md:whitespace-nowrap')}>
        <PortfolioEta shipment={shipment} />
      </td>
      <td className={cn(cell, desktopOnly, 'text-right font-mono text-sm')}>
        <ExceptionCount count={shipment.openExceptionCount ?? 0} />
      </td>
    </tr>
  )
}

function PortfolioEta({ shipment }: { shipment: Shipment }) {
  const { eta } = shipment
  // P1: an unknown ETA is said, never invented.
  if (eta === null) return <span className="text-unknown">Unknown</span>
  return (
    <SourcedDate
      date={eta}
      precision="day"
      operators={operatorNames(shipment.legs)}
      outdated={eta.outdated}
      lastUpdatedAt={shipment.lastEventAt}
      className="relative z-10"
    />
  )
}

// OP-20: open exceptions as a mono count; none reads as a dash.
function ExceptionCount({ count }: { count: number }) {
  if (count === 0) {
    return (
      <>
        <span aria-hidden>—</span>
        <span className="sr-only">No open exceptions</span>
      </>
    )
  }
  return (
    <>
      <span aria-hidden className="font-semibold">
        {count}
      </span>
      <span className="sr-only">{count} open exceptions</span>
    </>
  )
}
