import type { EtaPredictionInsight, Evidence } from '@/domain'
import type { ShipmentFacts } from '@/mocks/engine/facts'
import type { LegPrediction } from '@/mocks/engine/predicted-eta'
import type { ShipmentView } from '@/mocks/engine/shipment-view'
import { hoursBetween } from '@/mocks/engine/time'
import { describeEtaSource, formatDay, formatDuration, operatorName } from './format'
import { insight, rawEventEvidence } from './insight'

// BR-AI-05: within this margin the UI shows "AI prediction agrees with the current ETA".
export const PREDICTION_AGREES_WITHIN_HOURS = 2
const AI_SOURCE = 'ai'

// BR-AI-05 (AI-5), BR-ETA-06: the engine's prediction as an insight, separate from the ETA.
// None once delivered: there is nothing left to predict.
export function predictEtaInsight(
  facts: ShipmentFacts,
  view: ShipmentView,
  now: Date,
): EtaPredictionInsight | null {
  const { prediction, eta } = view
  if (!prediction) return null
  const evidence: Evidence[] = [
    rawEventEvidence(
      `Current ETA ${formatDay(eta.value)}, ${describeEtaSource(eta, facts)}`,
      eta.rawEventId,
    ),
    ...prediction.legs.filter((leg) => leg.delayHours > 0).map((leg) => legEvidence(facts, leg)),
  ]
  if (view.staleness.stale) evidence.push({ text: 'No recent operator update' })
  const predictedEta = {
    value: prediction.predictedEta,
    provenance: 'predicted' as const,
    source: AI_SOURCE,
    observedAt: now.toISOString(),
  }
  return insight('eta_prediction', { predictedEta }, prediction.confidence, evidence, now)
}

export function predictionAgrees(view: ShipmentView): boolean {
  if (!view.prediction) return true
  const gap = Math.abs(hoursBetween(view.eta.value, view.prediction.predictedEta))
  return gap <= PREDICTION_AGREES_WITHIN_HOURS
}

function legEvidence(
  facts: ShipmentFacts,
  { leg, delayFactor, remainingPlannedHours }: LegPrediction,
): Evidence {
  const carrier = leg.vessel ?? operatorName(facts, leg.operatorId)
  const slower = Math.round((delayFactor - 1) * 100)
  return {
    text: `${carrier} historically takes ${slower}% longer than planned (${formatDuration(remainingPlannedHours)} left on this leg)`,
  }
}
