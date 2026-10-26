'use client'

import { useQuery } from '@tanstack/react-query'
import { documentsService, queryKeys } from '@/services'

const FALLBACK_FILE_NAME = 'document.pdf'

// CP-14, US-C-05.
export function useDocuments(shipmentId: string) {
  return useQuery({
    queryKey: queryKeys.documents.list(shipmentId),
    queryFn: ({ signal }) => documentsService.list(shipmentId, { signal }),
  })
}

// CP-14: `GET /api/documents/:id/file`, saved through a temporary object URL.
export async function downloadDocument(documentId: string): Promise<void> {
  const { blob, fileName } = await documentsService.download(documentId)
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: fileName ?? FALLBACK_FILE_NAME,
  })
  link.click()
  URL.revokeObjectURL(url)
}
