'use client'

import { useState } from 'react'
import type { Shipment } from '@/domain'
import { AnalystNote } from '@/features/ai'
import { DocumentList } from '@/features/documents'
import { HighlightProvider, ShipmentTimeline, TransitLine } from '@/features/shipments'
import { monitoring } from '@/lib/monitoring'
import { Block, RawEventCell, SpecimenFacts, SpecimenHeader } from './specimen-blocks'
import { downloadDocument, useSpecimenData, type SpecimenData } from './use-specimen-data'

// TEMPORARY (T07, removed in T12): every shared component on one seeded shipment, in
// customer and ops density.
export function GallerySpecimen({ shipment, route }: { shipment: Shipment; route: string }) {
  const data = useSpecimenData(shipment.id)
  const timeline = data.timeline.data
  return (
    <HighlightProvider>
      <article className="border border-rule bg-paper">
        <SpecimenHeader shipment={shipment} route={route} prediction={data.prediction.data} />
        <SpecimenFacts shipment={shipment} prediction={data.prediction.data} />
        <Block title="Compact transit line">
          <TransitLine variant="compact" shipment={shipment} className="max-w-md" />
        </Block>
        {timeline && (
          <Block title="Full transit line">
            <TransitLine variant="full" shipment={shipment} timeline={timeline} />
          </Block>
        )}
        <NotesBlock data={data} />
        {timeline && (
          <>
            <Block title="Timeline · customer">
              <ShipmentTimeline shipment={shipment} timeline={timeline} />
            </Block>
            <Block title="Timeline · ops">
              <ShipmentTimeline
                shipment={shipment}
                timeline={timeline}
                variant="ops"
                renderRawEvent={(id) => (
                  <RawEventCell event={data.rawEvents.data?.find((event) => event.id === id)} />
                )}
              />
            </Block>
          </>
        )}
        <DocumentsBlock data={data} />
      </article>
    </HighlightProvider>
  )
}

function NotesBlock({ data }: { data: SpecimenData }) {
  const [lastAction, setLastAction] = useState('none')
  const { summary } = data
  return (
    <Block title="Analyst note · customer, then actionable (ops)">
      <div className="space-y-3">
        <AnalystNote insight={summary.data} loading={summary.isPending}>
          {summary.data?.content.text}
        </AnalystNote>
        <AnalystNote
          insight={summary.data}
          loading={summary.isPending}
          onUse={() => setLastAction('Use')}
          onEdit={() => setLastAction('Edit')}
          onDismiss={() => setLastAction('Dismiss')}
        >
          {summary.data?.content.text}
        </AnalystNote>
        <p className="font-mono text-xs text-ink-muted">Last note action: {lastAction}</p>
      </div>
    </Block>
  )
}

function DocumentsBlock({ data }: { data: SpecimenData }) {
  const [uploadRequested, setUploadRequested] = useState(false)
  const documents = data.documents.data ?? []
  const download = (documentId: string) => {
    downloadDocument(documentId).catch((error: unknown) => monitoring.captureException(error))
  }
  return (
    <Block title="Documents · customer, then ops">
      <div className="space-y-3">
        <DocumentList documents={documents} onDownload={(doc) => download(doc.id)} />
        <DocumentList
          documents={documents}
          density="ops"
          onDownload={(doc) => download(doc.id)}
          onUpload={() => setUploadRequested(true)}
        />
        {uploadRequested && (
          <p className="font-mono text-xs text-ink-muted">Upload requested (dialog in T09).</p>
        )}
      </div>
    </Block>
  )
}
