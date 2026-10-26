'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Shipment } from '@/domain'
import { usePredictionFact } from '@/features/ai'
import {
  LastUpdated,
  OnTimeIndicator,
  ProvenanceLegend,
  ShipmentStatus,
  SourcedDate,
  operatorNames,
} from '@/features/shipments'

interface DetailHeaderProps {
  shipment: Shipment
  // The list the page belongs to: Arrivals for the customer, Shipments for ops (06 §4).
  back?: { href: string; label: string }
}

const ARRIVALS = { href: '/portal', label: 'Arrivals' }

// CP-11: the answer first, "ARRIVING ≈ THU 14 NOV", then status, on-time and last update.
export function DetailHeader({ shipment, back = ARRIVALS }: DetailHeaderProps) {
  const prediction = usePredictionFact(shipment.id)
  return (
    <header className="space-y-3 border-b border-rule px-4 pt-5 pb-4 md:px-8">
      <Link
        href={back.href}
        className="field-label inline-flex items-center gap-1.5 hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-3.5" strokeWidth={1.5} />
        {back.label}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 space-y-1">
          <p className="font-mono text-sm">{shipment.reference}</p>
          <h1 className="flex flex-wrap items-baseline gap-x-3 font-condensed text-3xl leading-tight font-semibold tracking-wide uppercase">
            <ArrivalAnswer shipment={shipment} />
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <ShipmentStatus status={shipment.status} stamped />
          <OnTimeIndicator shipment={shipment} prediction={prediction} />
          <LastUpdated lastEventAt={shipment.lastEventAt} />
          <ProvenanceLegend />
        </div>
      </div>
    </header>
  )
}

// P1: an unknown ETA says so; a delivered shipment shows its delivery date (BR-ETA-01).
function ArrivalAnswer({ shipment }: { shipment: Shipment }) {
  const { eta } = shipment
  if (eta === null) return <span>Arrival unknown</span>
  return (
    <>
      <span>{shipment.status === 'delivered' ? 'Delivered' : 'Arriving'}</span>
      <SourcedDate
        date={eta}
        precision="day"
        operators={operatorNames(shipment.legs)}
        outdated={eta.outdated}
        lastUpdatedAt={shipment.lastEventAt}
      />
    </>
  )
}
