import { eurPayloadSchema } from '@/domain'
import type { RawEventRow } from '@/mocks/db/tables/raw-events'
import { toIsoUtc, type ParsedEvent } from '../parsed-event'

// 07 §3 `eur-csv`: "code;YYYY-MM-DD;HH:mm;place", with the time in UTC.
export function parseEurEvent(row: RawEventRow): ParsedEvent | null {
  const payload = eurPayloadSchema.safeParse(row.payload)
  if (!payload.success) return null
  const [code = '', date = '', time = '', place = ''] = payload.data.split(';')
  return {
    code,
    label: code,
    occurredAt: toIsoUtc(`${date}T${time}:00Z`),
    isEstimate: false,
    location: place,
    eta: null,
  }
}
