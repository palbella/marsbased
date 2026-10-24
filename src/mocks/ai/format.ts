import type { EtaView } from '@/mocks/engine/eta'
import type { ShipmentFacts } from '@/mocks/engine/facts'

const HOURS_PER_DAY = 24

// "Thu 14 Nov". The mock backend does not know the reader's time zone, so dates in AI text
// are in UTC; the UI shows the structured dates in local time (BR-TM-02).
const DAY_FORMAT = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

export function formatDay(iso: string): string {
  return DAY_FORMAT.format(new Date(iso)).replace(',', '')
}

// "16 h" under a day, "1 day" / "3 days" beyond.
export function formatDuration(hours: number): string {
  const absolute = Math.abs(hours)
  if (absolute < HOURS_PER_DAY) return `${Math.round(absolute)} h`
  const days = Math.round(absolute / HOURS_PER_DAY)
  return days === 1 ? '1 day' : `${days} days`
}

// BR-AI-01: "estimated by BlueWave", "our estimate", P1: always say where a date comes from.
export function describeEtaSource(eta: EtaView, facts: ShipmentFacts): string {
  if (eta.provenance === 'confirmed') return 'confirmed'
  if (eta.source === 'booking') return 'as planned at booking'
  if (eta.source === 'system') return 'our estimate'
  return `estimated by ${operatorName(facts, eta.source)}`
}

// Short operator names for text ("BlueWave Shipping Line" → "BlueWave").
export function operatorName(facts: ShipmentFacts, operatorId: string): string {
  const name = facts.operators.find((operator) => operator.id === operatorId)?.name
  return name?.split(' ')[0] ?? operatorId
}
