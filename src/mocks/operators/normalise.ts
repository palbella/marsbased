import type { MappingTarget } from '@/domain'
import type { OperatorRow } from '@/mocks/db/tables/operators'
import type { RawEventRow } from '@/mocks/db/tables/raw-events'
import type { StatusMappingRow } from '@/mocks/db/tables/status-mappings'
import { findMappingTarget } from './mapping'
import { parseRawEvent } from './parse-event'
import { toIsoUtc, type ParsedEvent } from './parsed-event'

export interface NormalisedEvent extends ParsedEvent {
  // BR-NM-05: every derived value traces back to the operator message.
  rawEventId: string
  legId: string
  operatorId: string
  receivedAt: string
  // null when no mapping exists yet (BR-NM-03).
  target: MappingTarget | null
}

// 04 §2: parse each event in its operator's format, map it, drop duplicates and order the
// rest by `occurredAt`. The mapping is looked up on every call, so confirming a mapping
// reprocesses past events too (BR-NM-03).
export function normaliseEvents(
  rows: RawEventRow[],
  operators: OperatorRow[],
  mappings: StatusMappingRow[],
): NormalisedEvent[] {
  const formats = new Map(operators.map((operator) => [operator.id, operator.format]))
  const events = rows.flatMap((row) => {
    const format = formats.get(row.operatorId)
    const parsed = format === undefined ? null : parseRawEvent(row, format)
    if (parsed === null) return []
    return [normalised(row, parsed, findMappingTarget(mappings, row.operatorId, parsed.code))]
  })
  return withoutDuplicates(events.sort(byArrival)).sort(byOccurrence)
}

// Rows are never mutated, so a row normalises the same way until its mapping changes; the
// engine re-reads every event of a shipment on each recomputation.
const cache = new WeakMap<RawEventRow, NormalisedEvent>()

function normalised(
  row: RawEventRow,
  parsed: ParsedEvent,
  target: MappingTarget | null,
): NormalisedEvent {
  const cached = cache.get(row)
  if (cached?.target === target) return cached
  const event = normalise(row, parsed, target)
  cache.set(row, event)
  return event
}

function normalise(
  row: RawEventRow,
  parsed: ParsedEvent,
  target: MappingTarget | null,
): NormalisedEvent {
  const event = {
    ...parsed,
    rawEventId: row.id,
    legId: row.legId,
    operatorId: row.operatorId,
    receivedAt: toIsoUtc(row.receivedAt),
    target,
  }
  if (target !== 'eta_update') return event
  // 04 §2: the payload date of an ETA update is the new ETA, not when it happened.
  return { ...event, eta: parsed.eta ?? parsed.occurredAt, occurredAt: event.receivedAt }
}

// BR-NM-04: the first one received wins; later copies are ignored.
function withoutDuplicates(events: NormalisedEvent[]): NormalisedEvent[] {
  const seen = new Set<string>()
  return events.filter((event) => {
    const key = [event.operatorId, event.legId, event.code, event.occurredAt].join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function byArrival(a: NormalisedEvent, b: NormalisedEvent): number {
  return a.receivedAt.localeCompare(b.receivedAt) || a.rawEventId.localeCompare(b.rawEventId)
}

// BR-NM-04: applied in `occurredAt` order, not in order of arrival.
function byOccurrence(a: NormalisedEvent, b: NormalisedEvent): number {
  return a.occurredAt.localeCompare(b.occurredAt) || byArrival(a, b)
}
