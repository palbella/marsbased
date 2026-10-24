import { confidencePercent, type Leg, type SourcedDate } from '@/domain'
import { formatStamp } from '@/lib/format-date'

// Sources that are not an operator id (domain/provenance.ts).
const BOOKING_SOURCE = 'booking'
const SYSTEM_SOURCE = 'system'
const AI_SOURCE = 'ai'

// Operator id → name, from the shipment's legs.
export type OperatorNames = Readonly<Record<string, string>>

export function operatorNames(legs: readonly Leg[]): OperatorNames {
  return Object.fromEntries(legs.map((leg) => [leg.operatorId, leg.operatorName]))
}

export interface SourceContext {
  operators?: OperatorNames
  // AI predictions: the insight's confidence (P3).
  confidence?: number
}

// An ETA carries the sentence our estimate is based on (02 §6.2); other dates do not.
export type DateWithBasis = SourcedDate & { basis?: string | null }

// SC-03, DS-05: the tooltip that says where a date comes from.
export function sourceLabel(date: DateWithBasis, context: SourceContext = {}): string {
  if (date.provenance === 'predicted' || date.source === AI_SOURCE) {
    if (context.confidence === undefined) return 'AI prediction'
    return `AI prediction · ${confidencePercent(context.confidence)}% confidence`
  }
  if (date.source === BOOKING_SOURCE) return 'Planned at booking'
  if (date.source === SYSTEM_SOURCE) {
    return date.basis ? `Our estimate, based on ${date.basis}` : 'Our estimate'
  }
  const operator = context.operators?.[date.source] ?? 'the operator'
  const verb = date.provenance === 'confirmed' ? 'Confirmed' : 'Estimated'
  return `${verb} by ${operator} · ${formatStamp(date.observedAt)}`
}
