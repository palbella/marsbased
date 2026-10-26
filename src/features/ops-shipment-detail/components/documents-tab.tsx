'use client'

import { useState } from 'react'
import type { Document } from '@/domain'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { Toast, ToastProvider } from '@/components/ui/toast'
import { useQueryFailure } from '@/components/ui/use-query-failure'
import {
  DocumentList,
  UploadDocumentDialog,
  downloadDocument,
  useDocuments,
} from '@/features/documents'
import { monitoring } from '@/lib/monitoring'

// OP-30 Documents tab: SC-08 in ops density with the multipart upload.
export function DocumentsTab({ shipmentId }: { shipmentId: string }) {
  const documents = useDocuments(shipmentId)
  const failure = useQueryFailure(documents)
  if (failure) {
    return (
      <ErrorState
        message="Documents could not be loaded."
        retrying={failure.retrying}
        onRetry={() => documents.refetch()}
      />
    )
  }
  if (!documents.isSuccess) return <LoadingState label="Loading documents" rows={3} />
  return <DocumentsPanel shipmentId={shipmentId} documents={documents.data} />
}

function DocumentsPanel({ shipmentId, documents }: { shipmentId: string; documents: Document[] }) {
  const [uploading, setUploading] = useState(false)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const download = useDownload()
  const uploaded = (message: string) => {
    setUploading(false)
    setConfirmation(message)
  }
  return (
    <ToastProvider>
      <DocumentList
        documents={documents}
        density="ops"
        onDownload={download.start}
        onUpload={() => setUploading(true)}
      />
      {download.failed && (
        <p role="alert" className="px-4 py-2 text-sm text-late md:px-8">
          The document could not be downloaded. Try again.
        </p>
      )}
      {uploading && (
        <UploadDocumentDialog
          shipmentId={shipmentId}
          documents={documents}
          onClose={() => setUploading(false)}
          onUploaded={uploaded}
        />
      )}
      {confirmation && (
        <Toast title={confirmation} onOpenChange={(open) => !open && setConfirmation(null)} />
      )}
    </ToastProvider>
  )
}

// CP-14: a failed download is shown inline and reported.
function useDownload() {
  const [failed, setFailed] = useState(false)
  const start = (document: Document) => {
    setFailed(false)
    downloadDocument(document.id).catch((error: unknown) => {
      setFailed(true)
      monitoring.captureException(error, { tags: { area: 'documents' } })
    })
  }
  return { start, failed }
}
