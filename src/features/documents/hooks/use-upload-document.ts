'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { DocumentUpload } from '@/domain'
import { documentsService, queryKeys } from '@/services'

// OP-30 Documents tab, BR-AC-03: the multipart upload (metadata only in Phase 1). A document
// change re-runs the engine (BR-EX-10), which may resolve a `missing_document` exception, so
// the shipment, its exceptions and the AI notes are read again. Never retried (02 §5.6).
export function useUploadDocument(shipmentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (upload: DocumentUpload) => documentsService.upload(shipmentId, upload),
    onSuccess: () => {
      const roots = [
        queryKeys.documents.list(shipmentId),
        queryKeys.shipments.all(),
        queryKeys.exceptions.all(),
        queryKeys.ai.all(),
      ]
      return Promise.all(roots.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
    },
  })
}
