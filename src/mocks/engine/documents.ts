import type { DocumentMetadata } from '@/domain'
import type { Tables } from '@/mocks/db/schema'
import type { DocumentRow } from '@/mocks/db/tables/documents'
import { nextId } from './records'

// BR-AC-03: metadata only in Phase 1. Creates the document or makes the existing one of that
// type available; the caller runs the engine afterwards (BR-EX-10). `userId` is null when the
// operator transmits it (BR-NA-03, SIM-05).
export function storeDocument(
  db: Tables,
  shipmentId: string,
  metadata: DocumentMetadata,
  userId: string | null,
  now: Date,
): DocumentRow {
  const file = {
    status: 'available' as const,
    fileName: metadata.fileName,
    size: metadata.size,
    uploadedBy: userId,
    uploadedAt: now.toISOString(),
  }
  const existing = db.documents
    .where((row) => row.shipmentId === shipmentId)
    .find((row) => row.type === metadata.type)
  if (existing) return db.documents.update(existing.id, file)
  const prefix = `doc_${shipmentId.replace('shp_', '')}`
  return db.documents.insert({
    id: nextId(db.documents, prefix),
    shipmentId,
    type: metadata.type,
    ...file,
  })
}

// BR-NA-03: a delivered shipment gets its proof of delivery, `pending` until it is uploaded or
// transmitted. Returns the created row, or null when the shipment already has one.
export function ensureProofOfDelivery(db: Tables, shipmentId: string): DocumentRow | null {
  const exists = db.documents
    .where((row) => row.shipmentId === shipmentId)
    .some((row) => row.type === 'proof_of_delivery')
  if (exists) return null
  const prefix = `doc_${shipmentId.replace('shp_', '')}`
  return db.documents.insert({
    id: nextId(db.documents, prefix),
    shipmentId,
    type: 'proof_of_delivery',
    status: 'pending',
    fileName: null,
    size: null,
    uploadedBy: null,
    uploadedAt: null,
  })
}
