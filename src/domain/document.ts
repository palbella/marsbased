import { z } from 'zod'
import { idSchema, isoDateTimeSchema } from './primitives'

// US-C-05, BR-NA-03.
export const documentTypeSchema = z.enum([
  'cmr',
  'bill_of_lading',
  'commercial_invoice',
  'packing_list',
  'customs_declaration',
  'proof_of_delivery',
])
export type DocumentType = z.infer<typeof documentTypeSchema>

export const documentStatusSchema = z.enum(['available', 'pending'])
export type DocumentStatus = z.infer<typeof documentStatusSchema>

// OP-13: PDF, max 10 MB.
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024
export const DOCUMENT_MIME_TYPE = 'application/pdf'

export const documentSchema = z.object({
  id: idSchema,
  shipmentId: idSchema,
  type: documentTypeSchema,
  status: documentStatusSchema,
  fileName: z.string().min(1).nullable(),
  size: z.number().int().positive().nullable(),
  uploadedAt: isoDateTimeSchema.nullable(),
})
export type Document = z.infer<typeof documentSchema>

export const documentListSchema = z.array(documentSchema)

// Metadata only in Phase 1 (BR-AC-03); shared with the `upload_document` action.
export const documentMetadataSchema = z.object({
  type: documentTypeSchema,
  fileName: z.string().trim().min(1),
  size: z.number().int().positive().max(MAX_DOCUMENT_SIZE_BYTES),
})
export type DocumentMetadata = z.infer<typeof documentMetadataSchema>

// POST /api/shipments/:id/documents (multipart fields).
export const documentUploadSchema = z.object({
  type: documentTypeSchema,
  file: z.file().max(MAX_DOCUMENT_SIZE_BYTES).mime(DOCUMENT_MIME_TYPE),
})
export type DocumentUpload = z.infer<typeof documentUploadSchema>
