import type { PriorityInsight } from '@/domain'
import type { ActivityRow } from '@/mocks/db/tables/activity'
import type { ExceptionRow } from '@/mocks/db/tables/exceptions'
import type { ShipmentFacts } from '@/mocks/engine/facts'
import { scorePriority } from '@/mocks/engine/priority'
import type { ShipmentView } from '@/mocks/engine/shipment-view'
import { insight, rawEventEvidence } from './insight'

// BR-AI-02.
const CONFIDENCE = 0.85
const STALE_CONFIDENCE_LOSS = 0.2

// BR-AI-02 (AI-2), BR-PR-03: the score with every factor behind it, so the ranking is never a
// black box.
export function explainPriority(
  exception: ExceptionRow,
  facts: ShipmentFacts,
  view: ShipmentView,
  activity: ActivityRow[],
  now: Date,
): PriorityInsight {
  const { score, factors, labels } = scorePriority(exception, facts, view, activity, now)
  const confidence = CONFIDENCE - (view.staleness.stale ? STALE_CONFIDENCE_LOSS : 0)
  const evidence = labels.map((label) =>
    label.startsWith('ETA') ? rawEventEvidence(label, view.eta.rawEventId) : { text: label },
  )
  return insight(
    'priority',
    { score, rationale: `Score ${score}: ${labels.join(', ')}.`, factors },
    Math.round(confidence * 100) / 100,
    evidence,
    now,
  )
}
