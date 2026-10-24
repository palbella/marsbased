import { documentListSchema, documentSchema, type DocumentUpload } from '@/domain'
import { apiDownload, apiGet, apiUpload, type RequestOptions } from './api-client'

// US-C-05, US-O-03.
export const documentsService = {
  list: (shipmentId: string, options?: RequestOptions) =>
    apiGet(`/shipments/${encodeURIComponent(shipmentId)}/documents`, documentListSchema, options),
  // Multipart; only the metadata is stored in Phase 1 (BR-AC-03).
  upload: (shipmentId: string, { type, file }: DocumentUpload) => {
    const form = new FormData()
    form.set('type', type)
    form.set('file', file)
    return apiUpload(`/shipments/${encodeURIComponent(shipmentId)}/documents`, form, documentSchema)
  },
  download: (documentId: string) =>
    apiDownload(`/documents/${encodeURIComponent(documentId)}/file`),
}
