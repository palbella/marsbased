import type { DocumentType, ExceptionType, Severity } from '@/domain'
import { findOperator, type ShipmentFacts } from './facts'
import type { ShipmentView } from './shipment-view'
import { hoursBetween } from './time'

// BR-EX-01: a delay is `high` beyond this many hours past the committed date.
const DELAY_HIGH_ABOVE_HOURS = 24
// BR-EX-03: customs not cleared this long after submission is an incident.
const CUSTOMS_INCIDENT_AFTER_HOURS = 48
// BR-EX-05: documents are checked from this long before the planned customs submission.
const MISSING_DOCUMENT_WINDOW_HOURS = 72
const MISSING_DOCUMENT_HIGH_UNDER_HOURS = 24
const CUSTOMS_DOCUMENTS: DocumentType[] = ['commercial_invoice', 'packing_list']

export interface DetectedException {
  type: ExceptionType
  severity: Severity
  // One line, shown in the queue and in the activity (OP-02).
  reason: string
  // The raw event that triggered it, if any (BR-AL-04).
  rawEventId: string | null
}

// BR-EX-01..05. BR-EX-07: a delivered shipment has no exceptions left.
export function detectExceptions(
  view: ShipmentView,
  facts: ShipmentFacts,
  now: Date,
): DetectedException[] {
  if (view.delivered) return []
  return [
    delay(view),
    hold(view, facts),
    customsIncident(view, now),
    stale(view),
    missingDocument(view, facts, now),
  ].filter((detected) => detected !== null)
}

// BR-EX-11: the silence of a shipment with a hold or customs incident is already explained.
export function mostSpecificWins(detected: DetectedException[]): DetectedException[] {
  const explained = detected.some((d) => d.type === 'hold' || d.type === 'customs_incident')
  return explained ? detected.filter((d) => d.type !== 'stale') : detected
}

// BR-EX-01.
function delay(view: ShipmentView): DetectedException | null {
  if (view.onTime !== 'late') return null
  const hours = Math.round(view.etaDeltaHours)
  return {
    type: 'delay',
    severity: view.etaDeltaHours <= DELAY_HIGH_ABOVE_HOURS ? 'medium' : 'high',
    reason:
      hours > 0
        ? `ETA ${hours} h after the committed date`
        : 'Committed date passed without delivery',
    rawEventId: view.eta.rawEventId,
  }
}

// BR-EX-02.
function hold(view: ShipmentView, facts: ShipmentFacts): DetectedException | null {
  const open = view.holds.find((candidate) => candidate.open)
  if (!open) return null
  const operator = findOperator(facts, open.reportedAt.source)?.name ?? open.reportedAt.source
  return {
    type: 'hold',
    severity: 'high',
    reason: `Customs hold reported by ${operator}`,
    rawEventId: open.rawEventId,
  }
}

// BR-EX-03: submitted, not cleared 48 h later, and no open hold (that is BR-EX-02).
function customsIncident(view: ShipmentView, now: Date): DetectedException | null {
  const submitted = view.milestones.find((milestone) => milestone.type === 'customs_submitted')
  const cleared = view.milestones.find((milestone) => milestone.type === 'customs_cleared')
  if (!submitted?.actual || cleared?.actual || view.holds.some((h) => h.open)) return null
  const waitingHours = hoursBetween(submitted.actual.value, now)
  if (waitingHours < CUSTOMS_INCIDENT_AFTER_HOURS) return null
  return {
    type: 'customs_incident',
    severity: 'high',
    reason: `Not cleared ${Math.round(waitingHours)} h after customs submission`,
    rawEventId: submitted.rawEventId,
  }
}

// BR-EX-04.
function stale(view: ShipmentView): DetectedException | null {
  const { stale: isStale, veryStale, silentHours, intervalHours } = view.staleness
  if (!isStale || silentHours === null) return null
  return {
    type: 'stale',
    severity: veryStale ? 'high' : 'medium',
    reason: `No operator update for ${Math.round(silentHours)} h (expected every ${intervalHours} h)`,
    rawEventId: null,
  }
}

// BR-EX-05.
function missingDocument(
  view: ShipmentView,
  facts: ShipmentFacts,
  now: Date,
): DetectedException | null {
  const planned = view.milestones.find((milestone) => milestone.type === 'customs_submitted')
  if (!view.hasCustoms || !planned) return null
  const hoursToSubmission = hoursBetween(now, planned.plannedAt)
  const missing = CUSTOMS_DOCUMENTS.filter((type) => !isAvailable(facts, type))
  if (hoursToSubmission >= MISSING_DOCUMENT_WINDOW_HOURS || missing.length === 0) return null
  const names = missing.map((type) => type.replaceAll('_', ' ')).join(' and ')
  return {
    type: 'missing_document',
    severity: hoursToSubmission < MISSING_DOCUMENT_HIGH_UNDER_HOURS ? 'high' : 'medium',
    reason:
      hoursToSubmission > 0
        ? `${capitalise(names)} pending, customs submission in ${Math.round(hoursToSubmission)} h`
        : `${capitalise(names)} pending, customs submission was due`,
    rawEventId: null,
  }
}

export function isAvailable(facts: ShipmentFacts, type: DocumentType): boolean {
  return facts.documents.some(
    (document) => document.type === type && document.status === 'available',
  )
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
