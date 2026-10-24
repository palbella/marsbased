import type { Exception } from '@/domain'
import type { ActivityRow } from '@/mocks/db/tables/activity'
import type { ExceptionRow } from '@/mocks/db/tables/exceptions'
import { detectExceptions } from '@/mocks/engine/exception-rules'
import { isActive } from '@/mocks/engine/exception-lifecycle'
import { findOperator } from '@/mocks/engine/facts'
import { nextActions } from '@/mocks/engine/next-actions'
import { scorePriority } from '@/mocks/engine/priority'
import type { LoadedShipment } from '@/mocks/queries/shipment-loader'

export interface ExceptionContext {
  shipment: LoadedShipment
  // The activity of the exception's shipment.
  activity: ActivityRow[]
  now: Date
}

// Next actions (BR-NA-01) and priority (BR-PR-01..03) are derived on read, as a backend
// view would; only the lifecycle is stored (02 §5.5 rule 4).
export function toExceptionResponse(row: ExceptionRow, context: ExceptionContext): Exception {
  const { facts, view } = context.shipment
  const priority = scorePriority(row, facts, view, context.activity, context.now)
  const operatorId = view.currentLeg.operatorId
  return {
    id: row.id,
    shipmentId: row.shipmentId,
    shipmentReference: facts.shipment.reference,
    accountName: facts.account.name,
    operatorId,
    operatorName: findOperator(facts, operatorId)?.name ?? operatorId,
    mode: view.currentLeg.mode,
    type: row.type,
    severity: row.severity,
    status: row.status,
    waitingOn: row.waitingOn,
    assigneeId: row.assigneeId,
    reason: reasonOf(row, context),
    // A resolved exception has nothing left to suggest.
    nextActions: isActive(row) ? nextActions(row, facts, view, context.activity) : [],
    priorityScore: priority.score,
    priorityFactors: priority.labels,
    detectedAt: row.detectedAt,
    resolvedAt: row.resolvedAt,
    resolutionNote: row.resolutionNote,
  }
}

// The current condition while it holds (e.g. "No operator update for 15 h"); otherwise the
// reason recorded when the engine raised it (BR-EX-07 history).
function reasonOf(row: ExceptionRow, { shipment, activity, now }: ExceptionContext): string {
  const current = isActive(row)
    ? detectExceptions(shipment.view, shipment.facts, now).find((item) => item.type === row.type)
    : undefined
  if (current) return current.reason
  const raised = activity
    .filter((entry) => entry.exceptionId === row.id && entry.type === 'exception_raised')
    .at(-1)
  return raised && 'reason' in raised.payload ? raised.payload.reason : row.type
}
