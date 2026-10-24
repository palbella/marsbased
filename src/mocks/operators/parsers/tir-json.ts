import { tirPayloadSchema } from '@/domain'
import type { RawEventRow } from '@/mocks/db/tables/raw-events'
import { toIsoUtc, type ParsedEvent } from '../parsed-event'

// 07 §3 `tir-json`: numeric status codes; `eta` is only set on ETA updates (code 700).
export function parseTirEvent(row: RawEventRow): ParsedEvent | null {
  const payload = tirPayloadSchema.safeParse(row.payload)
  if (!payload.success) return null
  const { code, ts, location, eta } = payload.data
  return {
    code,
    label: code,
    occurredAt: toIsoUtc(ts),
    isEstimate: false,
    location,
    eta: eta === null ? null : toIsoUtc(eta),
  }
}
