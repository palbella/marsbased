import type {
  DomainEvent,
  ExceptionActionRequest,
  NotifyCustomerPayload,
  UploadDocumentPayload,
} from '@/domain'
import type { Tables } from '@/mocks/db/schema'
import type { ExceptionRow } from '@/mocks/db/tables/exceptions'
import { nextId, recordActivity } from '../records'
import { recompute } from '../recompute'

export interface ActionContext {
  db: Tables
  exception: ExceptionRow
  userId: string
  now: Date
}

// BR-AC-01..05: the effect of each action; every one is recorded in `activity`.
export function applyEffect(
  context: ActionContext,
  request: ExceptionActionRequest,
): DomainEvent[] {
  const { db, exception, userId, now } = context
  recordActivity(db, {
    shipmentId: exception.shipmentId,
    exceptionId: exception.id,
    userId,
    type: request.type,
    payload: request.payload,
    at: now.toISOString(),
  })
  switch (request.type) {
    case 'notify_customer':
      return notifyCustomer(context, request.payload)
    case 'contact_operator':
      // BR-AC-02: logged only in Phase 1; the exception now waits on the operator.
      return update(context, { status: 'acknowledged', waitingOn: 'operator' })
    case 'upload_document':
      return uploadDocument(context, request.payload)
    case 'acknowledge':
      return update(context, { status: 'acknowledged', assigneeId: userId })
    case 'resolve':
      return update(context, {
        status: 'resolved',
        resolvedAt: now.toISOString(),
        resolutionNote: request.payload.note,
      })
  }
}

// BR-AC-01: an alert of type `message` for the shipment's account.
function notifyCustomer(context: ActionContext, payload: NotifyCustomerPayload): DomainEvent[] {
  const { db, exception, now } = context
  const shipment = db.shipments.findById(exception.shipmentId)
  if (!shipment) return []
  const alert = db.alerts.insert({
    id: nextId(db.alerts, 'alr'),
    shipmentId: shipment.id,
    accountId: shipment.accountId,
    type: 'message',
    title: payload.subject,
    message: payload.message,
    etaImpact: null,
    requiresAction: payload.requiresAction,
    createdAt: now.toISOString(),
    readAt: null,
  })
  return [
    ...update(context, { status: 'acknowledged' }),
    { type: 'alert.created', shipmentId: shipment.id, alertId: alert.id },
  ]
}

// BR-AC-03: the document becomes available, then the engine runs (BR-EX-10).
function uploadDocument(context: ActionContext, payload: UploadDocumentPayload): DomainEvent[] {
  const { db, exception, userId, now } = context
  const { shipmentId } = exception
  const file = {
    status: 'available' as const,
    fileName: payload.fileName,
    size: payload.size,
    uploadedBy: userId,
    uploadedAt: now.toISOString(),
  }
  const existing = db.documents
    .where((row) => row.shipmentId === shipmentId)
    .find((row) => row.type === payload.type)
  if (existing) {
    db.documents.update(existing.id, file)
  } else {
    const prefix = `doc_${shipmentId.replace('shp_', '')}`
    db.documents.insert({
      id: nextId(db.documents, prefix),
      shipmentId,
      type: payload.type,
      ...file,
    })
  }
  return [
    { type: 'document.changed', shipmentId },
    { type: 'exception.changed', shipmentId, exceptionId: exception.id },
    ...recompute(db, shipmentId, now),
  ]
}

function update(context: ActionContext, patch: Partial<Omit<ExceptionRow, 'id'>>): DomainEvent[] {
  const { db, exception } = context
  db.exceptions.update(exception.id, patch)
  return [
    { type: 'exception.changed', shipmentId: exception.shipmentId, exceptionId: exception.id },
  ]
}
