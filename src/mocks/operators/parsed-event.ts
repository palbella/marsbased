// 04 §2: what every operator parser extracts from its own format, before the mapping.
export interface ParsedEvent {
  // The status as the operator sends it; the key of the mapping lookup (BR-NM-01).
  code: string
  // Human-readable status, used by the mapping suggestion (BR-AI-04).
  label: string
  // The date the payload reports, ISO 8601 UTC (BR-TM-02).
  occurredAt: string
  isEstimate: boolean
  location: string
  // A new expected arrival, when the format carries it in its own field.
  eta: string | null
}

export function toIsoUtc(date: string | number): string {
  return new Date(date).toISOString()
}
