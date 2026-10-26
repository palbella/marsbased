'use client'

import Link from 'next/link'
import type { Shipment } from '@/domain'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { SectionErrorBoundary } from '@/components/ui/section-error-boundary'
import { useQueryFailure } from '@/components/ui/use-query-failure'
import { HighlightProvider, StaleNotice, useShipment } from '@/features/shipments'
import { NotFoundError } from '@/services'
import { DetailHeader } from './detail-header'
import { IncidentNotice } from './incident-notice'
import { ManifestBlocks } from './manifest-blocks'
import { SummarySection, TimelineSection, TransitSection } from './route-sections'
import { DocumentsSection, RelatedAlertsSection } from './side-sections'

// US-C-02, CP-10..16: the customer shipment detail. It only calls customer endpoints: no raw
// events, exceptions, priority or activity (CP-16, BR-PM-04).
export function ShipmentDetail({ id }: { id: string }) {
  const shipment = useShipment(id)
  const failure = useQueryFailure(shipment)
  if (failure?.error instanceof NotFoundError) return <ShipmentNotFound />
  if (failure) return <ErrorState retrying={failure.retrying} onRetry={() => shipment.refetch()} />
  if (!shipment.isSuccess) return <LoadingState label="Loading shipment" />
  return <DetailContent shipment={shipment.data} />
}

// CP-11: the content order; on mobile everything stacks in this order.
function DetailContent({ shipment }: { shipment: Shipment }) {
  return (
    <HighlightProvider>
      <article aria-label={`Shipment ${shipment.reference}`} className="pb-10">
        <DetailHeader shipment={shipment} />
        <SectionErrorBoundary section="incident-notice">
          <IncidentNotice shipment={shipment} />
        </SectionErrorBoundary>
        <StaleNotice lastEventAt={shipment.lastEventAt} stale={shipment.stale} />
        <ManifestBlocks shipment={shipment} />
        <SectionErrorBoundary section="transit-line">
          <TransitSection shipment={shipment} />
        </SectionErrorBoundary>
        <SectionErrorBoundary section="ai-summary">
          <SummarySection shipmentId={shipment.id} />
        </SectionErrorBoundary>
        <div className="mt-6 grid grid-cols-1 gap-6 md:px-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <SectionErrorBoundary section="timeline">
            <TimelineSection shipment={shipment} />
          </SectionErrorBoundary>
          <div className="space-y-6">
            <SectionErrorBoundary section="documents">
              <DocumentsSection shipmentId={shipment.id} />
            </SectionErrorBoundary>
            <SectionErrorBoundary section="related-alerts">
              <RelatedAlertsSection shipmentId={shipment.id} />
            </SectionErrorBoundary>
          </div>
        </div>
      </article>
    </HighlightProvider>
  )
}

// CP-15: outside the perimeter or non-existent, the same answer, revealing nothing else.
function ShipmentNotFound() {
  return (
    <EmptyState
      stamp="NOT FOUND"
      message="We couldn't find this shipment in your account."
      action={
        <Link href="/portal" className={buttonClasses('secondary')}>
          Back to arrivals
        </Link>
      }
    />
  )
}
