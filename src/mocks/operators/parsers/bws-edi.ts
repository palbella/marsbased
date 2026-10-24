import { bwsPayloadSchema } from '@/domain'
import type { RawEventRow } from '@/mocks/db/tables/raw-events'
import { toIsoUtc, type ParsedEvent } from '../parsed-event'

// 07 §3 `bws-edi`: the only format that flags estimates itself (BR-NM-02).
export function parseBwsEvent(row: RawEventRow): ParsedEvent | null {
  const payload = bwsPayloadSchema.safeParse(row.payload)
  if (!payload.success) return null
  const { eventCode, isEstimate, port, eventDateTime } = payload.data
  return {
    code: eventCode,
    label: eventCode,
    occurredAt: toIsoUtc(eventDateTime),
    isEstimate,
    location: port,
    eta: null,
  }
}
