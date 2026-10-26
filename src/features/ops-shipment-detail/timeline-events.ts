import type { MappingTarget, RawEvent, Timeline } from '@/domain'
import type { TimelineEvent } from '@/features/shipments'

// 06 §4: the targets that produce no milestone but still belong in the timeline. `ignore`
// is left out on purpose: the mapping says the event carries nothing to show.
const EVENT_LABELS: Partial<Record<MappingTarget, string>> = {
  eta_update: 'ETA update',
  position_update: 'Position update',
}
const UNMAPPED_LABEL = 'Unmapped'

// 06 §4: the operator events that no milestone or hold traces back to (BR-NM-05), shown in
// place: unmapped ones (BR-NM-03) and ETA or position updates.
export function eventOnlyRows(timeline: Timeline, rawEvents: RawEvent[]): TimelineEvent[] {
  const traced = new Set<string>()
  for (const milestone of timeline.milestones) {
    if (milestone.rawEventId) traced.add(milestone.rawEventId)
  }
  for (const hold of timeline.customsHolds) traced.add(hold.rawEventId)

  return rawEvents.flatMap((event) => {
    if (traced.has(event.id)) return []
    const label = event.target === null ? UNMAPPED_LABEL : EVENT_LABELS[event.target]
    if (label === undefined) return []
    return [
      {
        rawEventId: event.id,
        legId: event.legId,
        occurredAt: event.occurredAt,
        label,
        unmapped: event.target === null,
      },
    ]
  })
}
