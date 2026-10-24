import {
  CUSTOMS_PLACE_LABEL,
  hasOpenHold,
  milestoneLabels,
  milestoneStateLabels,
  stopMilestones,
  stopState,
  type SourcedDate,
  type TransitStop,
} from '@/domain'
import type { HighlightAnchor } from '../../highlight/highlight-context'

// What a full-line stop shows and answers to (SC-04, DS-06).

export function stopLabel(stop: TransitStop): string {
  if (stop.kind === 'customs') return CUSTOMS_PLACE_LABEL
  return milestoneLabels[stop.milestone.type]
}

export function stopStatusText(stop: TransitStop): string {
  if (stop.kind === 'customs' && hasOpenHold(stop.holds)) return 'On hold'
  return milestoneStateLabels[stopState(stop)]
}

// The latest reported date, or the plan when nothing is reported yet.
export function stopDate(stop: TransitStop): SourcedDate | undefined {
  const milestones = stopMilestones(stop)
  const reported = milestones.filter((milestone) => milestone.actual).at(-1)
  return reported?.actual ?? milestones.at(-1)?.planned
}

export function stopAnchor(stop: TransitStop): HighlightAnchor {
  const milestones = stopMilestones(stop)
  const holds = stop.kind === 'customs' ? stop.holds : []
  return {
    milestoneIds: milestones.map((milestone) => milestone.id),
    rawEventIds: [
      ...milestones.map((milestone) => milestone.rawEventId),
      ...holds.map((hold) => hold.rawEventId),
    ],
  }
}
