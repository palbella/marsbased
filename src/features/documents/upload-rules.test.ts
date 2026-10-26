import { describe, expect, it } from 'vitest'
import { MAX_DOCUMENT_SIZE_BYTES, type Document } from '@/domain'
import { fileProblem, missingDocumentType } from './upload-rules'

function document(type: Document['type'], status: Document['status']): Document {
  return {
    id: `doc_${type}`,
    shipmentId: 'shp_017',
    type,
    status,
    fileName: null,
    size: null,
    uploadedAt: null,
  }
}

describe('OP-13 upload document', () => {
  it('pre-selects the first pending document', () => {
    const documents = [
      document('bill_of_lading', 'available'),
      document('commercial_invoice', 'pending'),
      document('packing_list', 'pending'),
    ]
    expect(missingDocumentType(documents)).toBe('commercial_invoice')
  })

  it('pre-selects nothing when every document is available', () => {
    expect(missingDocumentType([document('cmr', 'available')])).toBeNull()
  })

  it('accepts a PDF of at most 10 MB only', () => {
    const pdf = (size: number) =>
      new File([new Uint8Array(size)], 'invoice.pdf', { type: 'application/pdf' })
    expect(fileProblem(pdf(1024))).toBeNull()
    expect(fileProblem(null)).toBe('Choose a PDF file.')
    expect(fileProblem(new File(['x'], 'invoice.txt', { type: 'text/plain' }))).toBe(
      'The file must be a PDF.',
    )
    expect(fileProblem(pdf(MAX_DOCUMENT_SIZE_BYTES + 1))).toBe('The file is larger than 10 MB.')
  })
})
