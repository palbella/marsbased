import { rawEventSchema, type RawEvent } from '@/domain'
import type { OperatorRow } from '@/mocks/db/tables/operators'
import type { RawEventRow } from '@/mocks/db/tables/raw-events'
import type { StatusMappingRow } from '@/mocks/db/tables/status-mappings'
import { findMappingTarget } from '@/mocks/operators/mapping'
import { parseRawEvent } from '@/mocks/operators/parse-event'
import { toIsoUtc } from '@/mocks/operators/parsed-event'

// US-O-04: the operator message as received, next to what its parser read from it. null for
// a payload its format cannot parse: it produced no milestone, so there is nothing to trace.
export function toRawEventResponse(
  row: RawEventRow,
  operator: OperatorRow,
  mappings: StatusMappingRow[],
): RawEvent | null {
  const parsed = parseRawEvent(row, operator.format)
  if (!parsed) return null
  // Parsing pairs `format` with its payload shape (discriminated union).
  return rawEventSchema.parse({
    id: row.id,
    legId: row.legId,
    operatorId: row.operatorId,
    code: parsed.code,
    label: parsed.label,
    occurredAt: parsed.occurredAt,
    receivedAt: toIsoUtc(row.receivedAt),
    mappingStatus: row.mappingStatus,
    target: findMappingTarget(mappings, row.operatorId, parsed.code),
    format: operator.format,
    payload: row.payload,
  })
}
