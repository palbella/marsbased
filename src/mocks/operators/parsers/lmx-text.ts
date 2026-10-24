import { lmxPayloadSchema } from '@/domain'
import type { RawEventRow } from '@/mocks/db/tables/raw-events'
import { toIsoUtc, type ParsedEvent } from '../parsed-event'

// 07 §3: Mexico City has been UTC−6 all year since it dropped daylight saving in 2022.
const MEXICO_CITY_UTC_OFFSET = '-06:00'
// "DD/MM/YYYY HH:mm", already checked by the payload schema.
const LOCAL_DATE = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/

// 07 §3 `lmx-text`: free-text statuses; the code is the text trimmed, compared exactly.
export function parseLmxEvent(row: RawEventRow): ParsedEvent | null {
  const payload = lmxPayloadSchema.safeParse(row.payload)
  if (!payload.success) return null
  const { status, date, city } = payload.data
  const code = status.trim()
  return {
    code,
    label: code,
    occurredAt: toIsoUtc(date.replace(LOCAL_DATE, `$3-$2-$1T$4:$5:00${MEXICO_CITY_UTC_OFFSET}`)),
    isEstimate: false,
    location: city,
    eta: null,
  }
}
