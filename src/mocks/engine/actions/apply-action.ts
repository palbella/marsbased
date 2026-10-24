import {
  exceptionActionRequestSchema,
  type DomainEvent,
  type ExceptionActionRequest,
} from '@/domain'
import type { Tables } from '@/mocks/db/schema'
import type { ExceptionRow } from '@/mocks/db/tables/exceptions'
import { applyEffect } from './action-effects'

export interface ActionInput {
  exceptionId: string
  userId: string
  // The request body, validated here (BR-AC-06).
  request: unknown
  now: Date
}

export type ActionResult =
  | { ok: true; exception: ExceptionRow; changes: DomainEvent[] }
  | { ok: false; status: 404 | 409 | 422; message: string }

// POST /api/exceptions/:id/actions (04 §10). The perimeter and role checks (BR-PM-*) belong
// to the handler; this applies the business rules.
export function applyExceptionAction(db: Tables, input: ActionInput): ActionResult {
  const exception = db.exceptions.findById(input.exceptionId)
  if (!exception) return { ok: false, status: 404, message: 'Exception not found.' }
  const parsed = exceptionActionRequestSchema.safeParse(input.request)
  // BR-AC-06.
  if (!parsed.success) return { ok: false, status: 422, message: 'Invalid action payload.' }
  if (exception.status === 'resolved') {
    return { ok: false, status: 409, message: 'The exception is already resolved.' }
  }
  const invalid = invalidForShipment(db, exception, parsed.data)
  if (invalid) return { ok: false, status: 422, message: invalid }

  const changes = applyEffect({ db, exception, userId: input.userId, now: input.now }, parsed.data)
  const updated = db.exceptions.findById(exception.id) ?? exception
  return { ok: true, exception: updated, changes }
}

// BR-AC-02: the operator contacted must run one of the shipment's legs.
function invalidForShipment(
  db: Tables,
  exception: ExceptionRow,
  request: ExceptionActionRequest,
): string | null {
  if (request.type !== 'contact_operator') return null
  const runsALeg = db.legs
    .where((leg) => leg.shipmentId === exception.shipmentId)
    .some((leg) => leg.operatorId === request.payload.operatorId)
  return runsALeg ? null : 'The operator does not carry this shipment.'
}
