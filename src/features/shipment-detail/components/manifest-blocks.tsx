'use client'

import type { Shipment } from '@/domain'
import { FieldBlock } from '@/components/ui/field-block'
import { useEtaPrediction } from '@/features/ai'
import { SourcedDate } from '@/features/shipments'
import { formatDay } from '@/lib/format-date'

// CP-11, DS-03: origin, destination, committed and predicted, laid out like a waybill.
export function ManifestBlocks({ shipment }: { shipment: Shipment }) {
  const { destination } = shipment
  return (
    <dl className="grid grid-cols-2 border-b border-rule bg-sheet md:grid-cols-4 md:px-4">
      <FieldBlock label="Origin">{shipment.originSiteName}</FieldBlock>
      <FieldBlock label="Destination">
        {destination.city}, {destination.country}
      </FieldBlock>
      <FieldBlock label="Committed">{formatDay(shipment.plannedEta)}</FieldBlock>
      <FieldBlock label="Predicted">
        <PredictedEta shipmentId={shipment.id} />
      </FieldBlock>
    </dl>
  )
}

// AI-5: never blocks the page; while loading, after a 204 or on failure there is no
// prediction to show (SC-06).
function PredictedEta({ shipmentId }: { shipmentId: string }) {
  const prediction = useEtaPrediction(shipmentId)
  if (prediction.isPending) {
    return (
      <span
        aria-label="Loading prediction"
        className="block h-4 w-24 animate-pulse rounded-xs bg-rule"
      />
    )
  }
  if (!prediction.data) return <span className="text-ink-muted">No prediction</span>
  return (
    <SourcedDate
      date={prediction.data.content.predictedEta}
      precision="day"
      confidence={prediction.data.confidence}
    />
  )
}
