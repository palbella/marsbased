import { http, HttpResponse } from 'msw'
import { documentUploadSchema, type DomainEvent } from '@/domain'
import { findShipmentInPerimeter, requireOps, requireUser } from '@/mocks/auth'
import { clock, database } from '@/mocks/db/instance'
import { storeDocument } from '@/mocks/engine/documents'
import { recompute } from '@/mocks/engine/recompute'
import { recordActivity } from '@/mocks/engine/records'
import { notFound, param, validationFailed, withMockLatency } from '@/mocks/http'
import { toDocumentResponse } from '@/mocks/mappers/document.mapper'
import { publishChanges } from '@/mocks/realtime/publish'
import { SAMPLE_DOCUMENT_MIME_TYPE, sampleDocument } from '@/mocks/sample-document'

// US-C-05, US-O-03. Reading is for both roles; uploading is ops only (BR-PM-03).
export const documentsHandlers = [
  http.get(
    '*/api/shipments/:id/documents',
    withMockLatency(({ request, params }) => {
      const user = requireUser(database, request)
      const shipment = findShipmentInPerimeter(database, user, param(params, 'id'))
      const documents = database.documents.where((row) => row.shipmentId === shipment.id)
      return HttpResponse.json(documents.map(toDocumentResponse))
    }),
  ),

  // Multipart; only the metadata is stored in Phase 1 (BR-AC-03, OP-13).
  http.post(
    '*/api/shipments/:id/documents',
    withMockLatency(({ request, params, body }) => {
      const user = requireUser(database, request)
      requireOps(user)
      const shipment = findShipmentInPerimeter(database, user, param(params, 'id'))
      const fields = body instanceof FormData ? Object.fromEntries(body) : {}
      const upload = documentUploadSchema.safeParse(fields)
      if (!upload.success)
        return validationFailed('A PDF of at most 10 MB and its type are required.')
      const now = clock.now()
      const metadata = {
        type: upload.data.type,
        fileName: upload.data.file.name,
        size: upload.data.file.size,
      }
      const document = storeDocument(database, shipment.id, metadata, user.id, now)
      recordActivity(database, {
        shipmentId: shipment.id,
        exceptionId: null,
        userId: user.id,
        type: 'upload_document',
        payload: metadata,
        at: now.toISOString(),
      })
      // BR-EX-10: a document change re-runs the engine for its shipment.
      const changes: DomainEvent[] = [{ type: 'document.changed', shipmentId: shipment.id }]
      publishChanges([...changes, ...recompute(database, shipment.id, now)])
      return HttpResponse.json(toDocumentResponse(document), { status: 201 })
    }),
  ),

  // 07 §4 "Documents": every file is the generated sample, served under the document's name.
  http.get(
    '*/api/documents/:id/file',
    withMockLatency(({ request, params }) => {
      const user = requireUser(database, request)
      const document = database.documents.findById(param(params, 'id'))
      if (!document) return notFound()
      findShipmentInPerimeter(database, user, document.shipmentId)
      if (document.status !== 'available' || document.fileName === null) return notFound()
      return new HttpResponse(sampleDocument(), {
        headers: {
          'content-type': SAMPLE_DOCUMENT_MIME_TYPE,
          'content-disposition': `attachment; filename="${document.fileName.replaceAll('"', '')}"`,
        },
      })
    }),
  ),
]
