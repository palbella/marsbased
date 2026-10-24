import type { DocumentType, ExceptionActionType, NextActionType } from '@/domain'
import type { ActivityRow } from '@/mocks/db/tables/activity'
import type { ExceptionRow } from '@/mocks/db/tables/exceptions'
import { isAvailable } from './exception-rules'
import type { ShipmentFacts } from './facts'
import type { ShipmentView } from './shipment-view'

// BR-NA-02: available on every exception besides the suggestions.
export const ALWAYS_AVAILABLE_ACTIONS: ExceptionActionType[] = ['acknowledge', 'resolve']

// BR-NA-03: the documents a shipment needs at its current point.
export function requiredDocuments(facts: ShipmentFacts, view: ShipmentView): DocumentType[] {
  const bySea = facts.legs.some((leg) => leg.mode === 'sea')
  const customsSubmitted = view.milestones.some(
    (milestone) => milestone.type === 'customs_submitted' && milestone.state === 'done',
  )
  const required: DocumentType[] = bySea
    ? ['bill_of_lading', 'commercial_invoice', 'packing_list']
    : ['cmr']
  if (customsSubmitted) required.push('customs_declaration')
  if (view.delivered) required.push('proof_of_delivery')
  return required
}

export function missingDocuments(facts: ShipmentFacts, view: ShipmentView): DocumentType[] {
  return requiredDocuments(facts, view).filter((type) => !isAvailable(facts, type))
}

// BR-NA-01: ordered suggestions; the first is the primary action shown in the queue.
export function nextActions(
  exception: ExceptionRow,
  facts: ShipmentFacts,
  view: ShipmentView,
  activity: ActivityRow[],
): NextActionType[] {
  switch (exception.type) {
    case 'delay':
      return customerMessaged(exception, activity)
        ? ['contact_operator', 'notify_customer']
        : ['notify_customer', 'contact_operator']
    case 'hold':
      return missingDocuments(facts, view).length > 0
        ? ['upload_document', 'notify_customer']
        : ['contact_operator', 'notify_customer']
    case 'customs_incident':
      return ['contact_operator', 'notify_customer']
    case 'stale':
      // A stale exception is `high` exactly when the shipment is very stale (BR-EX-04).
      return exception.severity === 'high'
        ? ['contact_operator', 'notify_customer']
        : ['contact_operator']
    case 'missing_document':
      return ['upload_document', 'contact_operator']
  }
}

function customerMessaged(exception: ExceptionRow, activity: ActivityRow[]): boolean {
  return activity.some(
    (entry) => entry.exceptionId === exception.id && entry.type === 'notify_customer',
  )
}
