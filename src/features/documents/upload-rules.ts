import {
  DOCUMENT_MIME_TYPE,
  MAX_DOCUMENT_SIZE_BYTES,
  type Document,
  type DocumentType,
} from '@/domain'

// OP-13: the dialog pre-selects the first document the shipment still waits for. The API
// lists the required documents (BR-NA-03), still `pending` until uploaded.
export function missingDocumentType(documents: readonly Document[]): DocumentType | null {
  return documents.find((document) => document.status === 'pending')?.type ?? null
}

// OP-13: a PDF of at most 10 MB; null when the file can be uploaded.
export function fileProblem(file: File | null): string | null {
  if (file === null) return 'Choose a PDF file.'
  if (file.type !== DOCUMENT_MIME_TYPE) return 'The file must be a PDF.'
  if (file.size === 0) return 'The file is empty.'
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) return 'The file is larger than 10 MB.'
  return null
}
