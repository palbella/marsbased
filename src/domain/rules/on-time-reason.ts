import type { Shipment } from '../shipment'

const MS_PER_HOUR = 3_600_000
// BR-OT-01: an ETA delay above this is at least `at_risk`.
const AT_RISK_DELAY_HOURS = 2

type OnTimeFacts = Pick<Shipment, 'onTime' | 'status' | 'eta' | 'plannedEta'>

// The AI prediction that can make a shipment `at_risk` (BR-OT-01, BR-AI-05).
export interface PredictionFact {
  value: string
  confidence: number
}

// SC-02: rephrases the BR-OT-01 / BR-OT-02 case that applied, for the indicator's tooltip.
// It explains the indicator the API returned; it never decides it.
export function onTimeReason(
  shipment: OnTimeFacts,
  prediction: PredictionFact | null,
  now: Date,
): string {
  if (shipment.status === 'delivered') return deliveredReason(shipment)
  const delay = etaDelayHours(shipment)
  if (shipment.onTime === 'unknown') return unknownReason(shipment)
  if (shipment.onTime === 'late' && now.getTime() > Date.parse(shipment.plannedEta)) {
    return 'The committed date has passed'
  }
  const etaExplainsRisk = delay !== null && delay > AT_RISK_DELAY_HOURS
  if (shipment.onTime === 'at_risk' && prediction && !etaExplainsRisk) {
    const predictedDelay = hoursAfterCommitted(prediction.value, shipment)
    return `AI predicts arrival ${hoursText(predictedDelay)} after the committed date`
  }
  if (delay === null) return 'No ETA available'
  if (delay <= 0) return 'ETA on or before the committed date'
  return `ETA ${hoursText(delay)} after the committed date`
}

function deliveredReason(shipment: OnTimeFacts): string {
  if (shipment.onTime === 'on_time') return 'Delivered on time'
  const delay = etaDelayHours(shipment)
  if (delay === null) return 'Delivered after the committed date'
  return `Delivered ${hoursText(delay)} after the committed date`
}

function unknownReason(shipment: OnTimeFacts): string {
  if (shipment.eta?.outdated) return 'No recent update from the operator; the ETA may be outdated'
  return 'No ETA available'
}

function etaDelayHours(shipment: OnTimeFacts): number | null {
  if (shipment.eta === null) return null
  return hoursAfterCommitted(shipment.eta.value, shipment)
}

function hoursAfterCommitted(date: string, shipment: OnTimeFacts): number {
  return (Date.parse(date) - Date.parse(shipment.plannedEta)) / MS_PER_HOUR
}

function hoursText(hours: number): string {
  return `${Math.round(hours)} h`
}
