'use client'

import type { ReactNode } from 'react'
import type { Exception, Shipment } from '@/domain'
import { FieldBlock } from '@/components/ui/field-block'
import { operatorNames, SourcedDate, TransitLine, useShipment } from '@/features/shipments'
import { formatDay } from '@/lib/format-date'
import { ModeGlyph } from '../exception-meta'

// OP-10, DS-03: account, operator, ETA (SC-03) and committed date, then the compact transit
// line. Account and operator come with the exception, so they show before the shipment.
export function PanelShipment({ exception }: { exception: Exception }) {
  const shipment = useShipment(exception.shipmentId)
  return (
    <section aria-label="Shipment" className="border-b border-rule">
      <dl className="grid grid-cols-2 sm:grid-cols-4">
        <FieldBlock label="Account">{exception.accountName}</FieldBlock>
        <FieldBlock label="Operator">
          <span className="inline-flex items-center gap-1.5">
            {exception.operatorName}
            <ModeGlyph mode={exception.mode} />
          </span>
        </FieldBlock>
        <FieldBlock label="ETA">
          <ShipmentValue shipment={shipment.data} failed={shipment.isError}>
            {(loaded) => <Eta shipment={loaded} />}
          </ShipmentValue>
        </FieldBlock>
        <FieldBlock label="Committed">
          <ShipmentValue shipment={shipment.data} failed={shipment.isError}>
            {(loaded) => formatDay(loaded.plannedEta)}
          </ShipmentValue>
        </FieldBlock>
      </dl>
      {shipment.data && (
        <TransitLine variant="compact" shipment={shipment.data} className="px-4 pb-4" />
      )}
    </section>
  )
}

interface ShipmentValueProps {
  shipment: Shipment | undefined
  failed: boolean
  children: (shipment: Shipment) => ReactNode
}

function ShipmentValue({ shipment, failed, children }: ShipmentValueProps) {
  if (shipment) return children(shipment)
  if (failed) return <span className="text-ink-muted">Not available</span>
  return <span aria-label="Loading" className="block h-4 w-20 animate-pulse rounded-xs bg-rule" />
}

// P1: an unknown ETA is said, never invented.
function Eta({ shipment }: { shipment: Shipment }) {
  if (shipment.eta === null) return <span className="text-unknown">Unknown</span>
  return (
    <SourcedDate
      date={shipment.eta}
      precision="day"
      operators={operatorNames(shipment.legs)}
      outdated={shipment.eta.outdated}
      lastUpdatedAt={shipment.lastEventAt}
    />
  )
}
