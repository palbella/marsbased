import type { Document } from '@/domain'
import type { DocumentRow } from '@/mocks/db/tables/documents'

// `uploadedBy` stays internal: customers can read documents (BR-PM-03).
export function toDocumentResponse(row: DocumentRow): Document {
  return {
    id: row.id,
    shipmentId: row.shipmentId,
    type: row.type,
    status: row.status,
    fileName: row.fileName,
    size: row.size,
    uploadedAt: row.uploadedAt,
  }
}
