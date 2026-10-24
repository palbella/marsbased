import { pldPayloadSchema } from '@/domain'
import type { RawEventRow } from '@/mocks/db/tables/raw-events'
import { toIsoUtc, type ParsedEvent } from '../parsed-event'

// 07 §3 `pld-json`: gate statuses at the port terminal.
export function parsePldEvent(row: RawEventRow): ParsedEvent | null {
  const payload = pldPayloadSchema.safeParse(row.payload)
  if (!payload.success) return null
  const { status, time, terminal } = payload.data
  return {
    code: status,
    label: status,
    occurredAt: toIsoUtc(time),
    isEstimate: false,
    location: terminal,
    eta: null,
  }
}
