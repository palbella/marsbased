import type { Shipment } from '../shipment'
import { shipmentStatusLabels } from './labels'
import { hoursAfterCommitted, isPredictedRisk, type PredictionFact } from './on-time-reason'

const HOURS_PER_DAY = 24
// CP-03: below this a delay reads in hours ("About 5 h behind…"), otherwise in days.
const DELAY_IN_HOURS_BELOW = 12

type SentenceFacts = Pick<Shipment, 'status' | 'onTime' | 'eta' | 'plannedEta'>

// CP-03: the one status sentence of an arrivals row. An `at_risk` caused by the AI
// prediction names it, like `onTimeReason()`. The day formatter comes from the caller, so
// the rule stays free of locale and time zone.
export function statusSentence(
  shipment: SentenceFacts,
  prediction: PredictionFact | null,
  formatDay: (iso: string) => string,
): string {
  if (shipment.status === 'on_hold') return 'Held at customs'
  const committed = formatDay(shipment.plannedEta)
  if (prediction && isPredictedRisk(shipment)) {
    const predictedDelay = hoursAfterCommitted(prediction.value, shipment)
    if (predictedDelay > 0) {
      return `AI predicts about ${delayText(predictedDelay)} behind the committed ${committed}`
    }
  }
  const delay = shipment.eta && hoursAfterCommitted(shipment.eta.value, shipment)
  const behind = shipment.onTime === 'late' || shipment.onTime === 'at_risk'
  if (behind && delay !== null && delay > 0) {
    return `About ${delayText(delay)} behind the committed ${committed}`
  }
  if (shipment.onTime === 'unknown') return 'No recent update from the operator'
  if (shipment.status === 'booked') return 'Booked, waiting for pickup'
  return shipmentStatusLabels[shipment.status]
}

function delayText(hours: number): string {
  if (hours < DELAY_IN_HOURS_BELOW) return `${Math.max(1, Math.round(hours))} h`
  const days = Math.max(1, Math.round(hours / HOURS_PER_DAY))
  return days === 1 ? '1 day' : `${days} days`
}
