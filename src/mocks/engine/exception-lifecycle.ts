import { contactOperatorPayloadSchema, type Severity } from '@/domain'
import type { Tables } from '@/mocks/db/schema'
import type { ExceptionRow } from '@/mocks/db/tables/exceptions'
import type { DetectedException } from './exception-rules'
import type { ShipmentFacts } from './facts'
import { isAfter } from './time'

const SEVERITY_RANK: Record<Severity, number> = { low: 1, medium: 2, high: 3 }

export function isActive(exception: ExceptionRow): boolean {
  return exception.status !== 'resolved'
}

// BR-EX-08: after an agent resolves an exception by hand, the engine does not reopen that type
// unless the severity increases or a new event arrives after the resolution.
export function suppressedByManualResolution(
  db: Tables,
  facts: ShipmentFacts,
  detected: DetectedException,
): boolean {
  const latest = db.exceptions
    .where((row) => row.shipmentId === facts.shipment.id && row.type === detected.type)
    .filter((row) => row.resolvedAt !== null)
    .sort((a, b) => (a.resolvedAt ?? '').localeCompare(b.resolvedAt ?? ''))
    .at(-1)
  if (!latest?.resolvedAt || !resolvedByHand(db, latest)) return false
  const resolvedAt = latest.resolvedAt
  const severityIncreased = SEVERITY_RANK[detected.severity] > SEVERITY_RANK[latest.severity]
  const newEvent = facts.events.some((event) => isAfter(event.receivedAt, resolvedAt))
  return !severityIncreased && !newEvent
}

function resolvedByHand(db: Tables, exception: ExceptionRow): boolean {
  return db.activity
    .where((entry) => entry.exceptionId === exception.id)
    .some((entry) => entry.type === 'resolve')
}

// BR-AC-02: a new event from the contacted operator clears `waitingOn`.
export function operatorAnswered(
  db: Tables,
  facts: ShipmentFacts,
  exception: ExceptionRow,
): boolean {
  const contact = db.activity
    .where((entry) => entry.exceptionId === exception.id && entry.type === 'contact_operator')
    .at(-1)
  const payload = contactOperatorPayloadSchema.safeParse(contact?.payload)
  if (!contact || !payload.success) return false
  return facts.events.some(
    (event) =>
      event.operatorId === payload.data.operatorId && isAfter(event.receivedAt, contact.at),
  )
}
