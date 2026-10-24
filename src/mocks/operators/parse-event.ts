import type { OperatorFormat } from '@/domain'
import type { RawEventRow } from '@/mocks/db/tables/raw-events'
import type { ParsedEvent } from './parsed-event'
import { parseBwsEvent } from './parsers/bws-edi'
import { parseEurEvent } from './parsers/eur-csv'
import { parseLmxEvent } from './parsers/lmx-text'
import { parsePldEvent } from './parsers/pld-json'
import { parseTirEvent } from './parsers/tir-json'

const PARSERS: Record<OperatorFormat, (row: RawEventRow) => ParsedEvent | null> = {
  'tir-json': parseTirEvent,
  'eur-csv': parseEurEvent,
  'pld-json': parsePldEvent,
  'bws-edi': parseBwsEvent,
  'lmx-text': parseLmxEvent,
}

// Rows are never mutated (Table.update replaces the object), so a row parses the same way
// every time; the engine re-reads every event on each recomputation.
const parsed = new WeakMap<RawEventRow, ParsedEvent | null>()

// 04 §2: the operator's `format` selects its parser. null when the payload does not match
// the format, so a malformed message never produces a date (P1).
export function parseRawEvent(row: RawEventRow, format: OperatorFormat): ParsedEvent | null {
  const cached = parsed.get(row)
  if (cached !== undefined) return cached
  const result = PARSERS[format](row)
  parsed.set(row, result)
  return result
}
