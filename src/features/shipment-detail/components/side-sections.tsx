'use client'

import { useState } from 'react'
import type { Document } from '@/domain'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { useQueryFailure } from '@/components/ui/use-query-failure'
import { AlertList, useAlerts } from '@/features/alerts'
import { DocumentList, downloadDocument, useDocuments } from '@/features/documents'
import { monitoring } from '@/lib/monitoring'
import { DetailSection } from './detail-section'

const SIDE_SKELETON_ROWS = 2

// CP-14, US-C-05: list and download. A failed download is shown inline and reported.
export function DocumentsSection({ shipmentId }: { shipmentId: string }) {
  const documents = useDocuments(shipmentId)
  const failure = useQueryFailure(documents)
  const [downloadFailed, setDownloadFailed] = useState(false)
  const download = (document: Document) => {
    setDownloadFailed(false)
    downloadDocument(document.id).catch((error: unknown) => {
      setDownloadFailed(true)
      monitoring.captureException(error, { tags: { area: 'documents' } })
    })
  }
  return (
    <DetailSection title="Documents">
      {!failure && documents.isPending && (
        <LoadingState rows={SIDE_SKELETON_ROWS} className="px-0 py-0 md:px-0" />
      )}
      {failure && (
        <ErrorState
          message="Documents could not be loaded."
          retrying={failure.retrying}
          onRetry={() => documents.refetch()}
        />
      )}
      {documents.data && <DocumentList documents={documents.data} onDownload={download} />}
      {downloadFailed && (
        <p role="alert" className="mt-2 px-4 text-sm text-late md:px-0">
          The document could not be downloaded. Try again.
        </p>
      )}
    </DetailSection>
  )
}

// CP-11, CP-21: the alerts of this shipment, newest first; opening one marks it as read.
export function RelatedAlertsSection({ shipmentId }: { shipmentId: string }) {
  const alerts = useAlerts({ shipmentId })
  const failure = useQueryFailure(alerts)
  return (
    <DetailSection title="Alerts for this shipment">
      {!failure && alerts.isPending && (
        <LoadingState rows={SIDE_SKELETON_ROWS} className="px-0 py-0 md:px-0" />
      )}
      {failure && (
        <ErrorState
          message="Alerts could not be loaded."
          retrying={failure.retrying}
          onRetry={() => alerts.refetch()}
        />
      )}
      {alerts.data?.length === 0 && (
        <p className="border-y border-rule bg-sheet px-4 py-4 text-sm text-ink-muted">
          No alerts for this shipment.
        </p>
      )}
      {alerts.data && alerts.data.length > 0 && (
        <AlertList alerts={alerts.data} label="Alerts for this shipment" />
      )}
    </DetailSection>
  )
}
