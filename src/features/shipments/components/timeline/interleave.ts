import type { Milestone } from '@/domain'

// 06 §4: an operator event that produced no milestone (unmapped, ETA or position update),
// shown in place in the ops timeline.
export interface TimelineEvent {
  rawEventId: string
  legId: string
  occurredAt: string
  label: string
  unmapped: boolean
}

export type TimelineEntry =
  { kind: 'milestone'; milestone: Milestone } | { kind: 'event'; event: TimelineEvent }

// Milestones keep their plan order (BR-MS-01); each event goes before the first milestone
// that happened, or is planned, after it. A milestone with no date yet never comes before an
// event that already happened.
export function interleave(milestones: Milestone[], events: TimelineEvent[]): TimelineEntry[] {
  const pending = [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
  const entries: TimelineEntry[] = []
  for (const milestone of milestones) {
    const at = milestoneTime(milestone)
    while (pending[0] && (at === null || Date.parse(pending[0].occurredAt) < at)) {
      const [event] = pending.splice(0, 1)
      if (event) entries.push({ kind: 'event', event })
    }
    entries.push({ kind: 'milestone', milestone })
  }
  return [...entries, ...pending.map((event): TimelineEntry => ({ kind: 'event', event }))]
}

function milestoneTime({ actual, planned }: Milestone): number | null {
  const value = actual?.value ?? planned?.value
  return value === undefined ? null : Date.parse(value)
}
