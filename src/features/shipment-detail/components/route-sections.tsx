'use client'

import type { Shipment } from '@/domain'
import { ErrorState } from '@/components/ui/error-state'
import { useQueryFailure } from '@/components/ui/use-query-failure'
import { AnalystNote, useShipmentSummary } from '@/features/ai'
import { ShipmentTimeline, TransitLine, useShipmentTimeline } from '@/features/shipments'
import { DetailSection } from './detail-section'

// CP-11, SC-04: the full transit line. It shares the timeline query with the timeline
// section, which shows the error and its Retry, so a failure is reported only once.
export function TransitSection({ shipment }: { shipment: Shipment }) {
  const timeline = useShipmentTimeline(shipment.id)
  const failure = useQueryFailure(timeline)
  if (failure) return null
  if (!timeline.isSuccess) {
    return <div aria-hidden className="mx-4 my-6 h-16 animate-pulse rounded-xs bg-rule md:mx-8" />
  }
  return (
    <section aria-label="Route" className="border-b border-rule px-4 py-5 md:px-8">
      <TransitLine variant="full" shipment={shipment} timeline={timeline.data} />
    </section>
  )
}

// AI-1, SC-06: hidden on failure; the rest of the page is not affected.
export function SummarySection({ shipmentId }: { shipmentId: string }) {
  const summary = useShipmentSummary(shipmentId)
  return (
    <AnalystNote insight={summary.data} loading={summary.isPending} className="mx-4 mt-6 md:mx-8">
      {summary.data?.content.text}
    </AnalystNote>
  )
}

// SC-05: the customer variant, with no raw events (CP-16).
export function TimelineSection({ shipment }: { shipment: Shipment }) {
  const timeline = useShipmentTimeline(shipment.id)
  const failure = useQueryFailure(timeline)
  return (
    <DetailSection title="Timeline">
      {!failure && timeline.isPending && (
        <div aria-hidden className="h-48 animate-pulse rounded-xs bg-rule" />
      )}
      {failure && (
        <ErrorState
          message="The timeline could not be loaded."
          retrying={failure.retrying}
          onRetry={() => timeline.refetch()}
        />
      )}
      {timeline.data && <ShipmentTimeline shipment={shipment} timeline={timeline.data} />}
    </DetailSection>
  )
}
