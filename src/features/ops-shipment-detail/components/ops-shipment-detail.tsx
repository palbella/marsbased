'use client'

import Link from 'next/link'
import type { Shipment } from '@/domain'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { SectionErrorBoundary } from '@/components/ui/section-error-boundary'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQueryFailure } from '@/components/ui/use-query-failure'
import { ExceptionPanel, ShipmentExceptions } from '@/features/exceptions'
import {
  DetailHeader,
  ManifestBlocks,
  SummarySection,
  TransitSection,
} from '@/features/shipment-detail'
import { HighlightProvider, StaleNotice, useShipment } from '@/features/shipments'
import { NotFoundError } from '@/services'
import { detailTabSchema, useDetailParams, type DetailTab } from '../hooks/use-detail-params'
import { ActivityTab } from './activity-tab'
import { DocumentsTab } from './documents-tab'
import { TimelineTab } from './timeline-tab'

const SHIPMENTS = { href: '/ops/shipments', label: 'Shipments' }

const TAB_LABELS: Record<DetailTab, string> = {
  timeline: 'Timeline',
  exceptions: 'Exceptions',
  documents: 'Documents',
  activity: 'Activity',
}

// US-O-04, OP-30: the customer detail's header, manifest, transit line and AI summary
// (05 §3), plus the ops tabs (06 §4).
export function OpsShipmentDetail({ id }: { id: string }) {
  const shipment = useShipment(id)
  const failure = useQueryFailure(shipment)
  if (failure?.error instanceof NotFoundError) return <ShipmentNotFound />
  if (failure) return <ErrorState retrying={failure.retrying} onRetry={() => shipment.refetch()} />
  if (!shipment.isSuccess) return <LoadingState label="Loading shipment" />
  return <DetailContent shipment={shipment.data} />
}

function DetailContent({ shipment }: { shipment: Shipment }) {
  const params = useDetailParams()
  return (
    <HighlightProvider>
      <article aria-label={`Shipment ${shipment.reference}`} className="pb-10">
        <DetailHeader shipment={shipment} back={SHIPMENTS} />
        <StaleNotice lastEventAt={shipment.lastEventAt} stale={shipment.stale} />
        <ManifestBlocks shipment={shipment} />
        <SectionErrorBoundary section="transit-line">
          <TransitSection shipment={shipment} />
        </SectionErrorBoundary>
        <SectionErrorBoundary section="ai-summary">
          <SummarySection shipmentId={shipment.id} />
        </SectionErrorBoundary>
        <DetailTabs shipment={shipment} params={params} />
        <ExceptionPanel exceptionId={params.exceptionId} onClose={params.closeException} />
      </article>
    </HighlightProvider>
  )
}

type DetailParams = ReturnType<typeof useDetailParams>

// 06 §4: Timeline, Exceptions, Documents and Activity; arrow keys move between tabs (Radix),
// which mounts only the active panel, so each tab loads when it is opened.
function DetailTabs({ shipment, params }: { shipment: Shipment; params: DetailParams }) {
  const select = (value: string) => {
    const tab = detailTabSchema.safeParse(value).data
    if (tab) params.selectTab(tab)
  }
  return (
    <Tabs value={params.tab} onValueChange={select} className="mt-6">
      <TabsList aria-label="Shipment details">
        {detailTabSchema.options.map((tab) => (
          <TabsTrigger key={tab} value={tab}>
            {TAB_LABELS[tab]}
          </TabsTrigger>
        ))}
      </TabsList>
      <SectionErrorBoundary section={`tab-${params.tab}`}>
        <TabsContent value={params.tab}>
          <TabPanel tab={params.tab} shipment={shipment} params={params} />
        </TabsContent>
      </SectionErrorBoundary>
    </Tabs>
  )
}

function TabPanel({
  tab,
  shipment,
  params,
}: {
  tab: DetailTab
  shipment: Shipment
  params: DetailParams
}) {
  if (tab === 'timeline') return <TimelineTab shipment={shipment} />
  if (tab === 'documents') return <DocumentsTab shipmentId={shipment.id} />
  if (tab === 'activity') return <ActivityTab shipmentId={shipment.id} />
  return (
    <ShipmentExceptions
      shipmentId={shipment.id}
      onOpen={(exception) => params.openException(exception.id)}
    />
  )
}

// BR-PM-02: outside the perimeter or non-existent, the same answer.
function ShipmentNotFound() {
  return (
    <EmptyState
      stamp="NOT FOUND"
      message="We couldn't find this shipment in your perimeter."
      action={
        <Link href="/ops/shipments" className={buttonClasses('secondary')}>
          Back to shipments
        </Link>
      }
    />
  )
}
