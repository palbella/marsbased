import type { ExceptionType } from '@/domain'
import type { Tables } from '@/mocks/db/schema'
import type { ExceptionRow } from '@/mocks/db/tables/exceptions'
import { isActive, operatorAnswered, suppressedByManualResolution } from './exception-lifecycle'
import { mostSpecificWins, type DetectedException } from './exception-rules'
import type { ShipmentFacts } from './facts'
import { nextId, recordActivity } from './records'
import type { ShipmentView } from './shipment-view'

// BR-EX-07: why a condition stopped holding.
const RESOLVED_BECAUSE: Record<ExceptionType, string> = {
  delay: 'the ETA is back within the committed date',
  hold: 'customs released the hold',
  customs_incident: 'customs cleared the shipment',
  stale: 'the operator reported again',
  missing_document: 'the required documents are available',
}
const DELIVERED_BECAUSE = 'the shipment was delivered'
const EXPLAINED_BECAUSE = 'explained by an open hold or customs incident'

export interface ExceptionChanges {
  changedIds: string[]
  // Raised in this recomputation (BR-AL-01 `on_hold`, `customs_issue`).
  raised: { exception: ExceptionRow; detected: DetectedException }[]
}

// BR-EX-06..08, BR-EX-11: one open exception per type, kept in line with the conditions.
export function upsertExceptions(
  db: Tables,
  facts: ShipmentFacts,
  view: ShipmentView,
  detected: DetectedException[],
  now: Date,
): ExceptionChanges {
  const active = mostSpecificWins(
    detected.filter((candidate) => !suppressedByManualResolution(db, facts, candidate)),
  )
  const open = db.exceptions.where((row) => row.shipmentId === facts.shipment.id && isActive(row))
  const changes: ExceptionChanges = { changedIds: [], raised: [] }

  for (const condition of active) {
    const existing = open.find((row) => row.type === condition.type)
    if (!existing) {
      const exception = raise(db, facts.shipment.id, condition, now)
      changes.raised.push({ exception, detected: condition })
      changes.changedIds.push(exception.id)
    } else if (existing.severity !== condition.severity) {
      db.exceptions.update(existing.id, { severity: condition.severity })
      changes.changedIds.push(existing.id)
    }
  }
  for (const exception of open.filter((row) => !active.some((c) => c.type === row.type))) {
    resolveAutomatically(db, exception, resolutionReason(exception, view, detected), now)
    changes.changedIds.push(exception.id)
  }
  return { ...changes, changedIds: [...changes.changedIds, ...clearWaitingOn(db, facts)] }
}

function raise(db: Tables, shipmentId: string, condition: DetectedException, now: Date) {
  const exception = db.exceptions.insert({
    id: nextId(db.exceptions, 'exc'),
    shipmentId,
    type: condition.type,
    severity: condition.severity,
    status: 'open',
    waitingOn: null,
    assigneeId: null,
    detectedAt: now.toISOString(),
    resolvedAt: null,
    resolutionNote: null,
  })
  recordActivity(db, {
    shipmentId,
    exceptionId: exception.id,
    userId: null,
    type: 'exception_raised',
    payload: { exceptionType: condition.type, reason: condition.reason },
    at: exception.detectedAt,
  })
  return exception
}

function resolutionReason(
  exception: ExceptionRow,
  view: ShipmentView,
  detected: DetectedException[],
): string {
  if (view.delivered) return DELIVERED_BECAUSE
  // BR-EX-11: still stale, but no longer the most specific explanation.
  if (detected.some((condition) => condition.type === exception.type)) return EXPLAINED_BECAUSE
  return RESOLVED_BECAUSE[exception.type]
}

// BR-EX-07.
function resolveAutomatically(db: Tables, exception: ExceptionRow, reason: string, now: Date) {
  const at = now.toISOString()
  const note = `Resolved automatically: ${reason}`
  db.exceptions.update(exception.id, { status: 'resolved', resolvedAt: at, resolutionNote: note })
  recordActivity(db, {
    shipmentId: exception.shipmentId,
    exceptionId: exception.id,
    userId: null,
    type: 'exception_auto_resolved',
    payload: { exceptionType: exception.type, reason: note },
    at,
  })
}

// BR-AC-02.
function clearWaitingOn(db: Tables, facts: ShipmentFacts): string[] {
  const waiting = db.exceptions.where(
    (row) => row.shipmentId === facts.shipment.id && isActive(row) && row.waitingOn !== null,
  )
  const answered = waiting.filter((row) => operatorAnswered(db, facts, row))
  for (const row of answered) db.exceptions.update(row.id, { waitingOn: null })
  return answered.map((row) => row.id)
}
