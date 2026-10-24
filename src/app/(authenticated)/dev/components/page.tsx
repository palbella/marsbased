'use client'

import { useQuery } from '@tanstack/react-query'
import { notFound } from 'next/navigation'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { PageHeader } from '@/components/ui/page-header'
import { ProvenanceLegend } from '@/features/shipments'
import { IS_NON_PRODUCTION } from '@/lib/environment'
import { queryKeys, shipmentsService } from '@/services'
import { GallerySpecimen } from './gallery-specimen'

// TEMPORARY (T07, removed in T12): a non-production gallery of the shared shipment
// components on seeded shipments, one per route type in 07 §4. Sign in as an ops manager
// to see all of them (the perimeter applies).
const SPECIMENS = [
  { reference: 'SH-10401', route: 'Road only, in transit' },
  { reference: 'SH-10407', route: 'Booked, no events' },
  { reference: 'SH-10433', route: 'Multimodal with customs, at sea' },
  { reference: 'SH-10436', route: 'Multimodal, late' },
  { reference: 'SH-10441', route: 'Multimodal, on hold in customs' },
  { reference: 'SH-10452', route: 'Multimodal, delivered' },
]

export default function ComponentGalleryPage() {
  if (!IS_NON_PRODUCTION) notFound()
  return (
    <>
      <PageHeader
        title="Component gallery"
        subtitle="Temporary · non-production · T07"
        actions={<ProvenanceLegend />}
      />
      <GalleryContent />
    </>
  )
}

function GalleryContent() {
  const shipments = useQuery({
    queryKey: queryKeys.shipments.list({}),
    queryFn: ({ signal }) => shipmentsService.list({}, { signal }),
  })
  if (shipments.isPending) return <LoadingState label="Loading shipments" />
  if (shipments.isError) return <ErrorState onRetry={() => shipments.refetch()} />
  return (
    <div className="space-y-10 px-4 py-6 md:px-8">
      {SPECIMENS.map(({ reference, route }) => {
        const shipment = shipments.data.find((candidate) => candidate.reference === reference)
        if (!shipment) {
          return (
            <p key={reference} className="text-sm text-ink-muted">
              {reference} is outside your perimeter. Sign in as an ops manager to see it.
            </p>
          )
        }
        return <GallerySpecimen key={reference} shipment={shipment} route={route} />
      })}
    </div>
  )
}
