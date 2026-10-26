import type { OnTimeIndicator, ShipmentStatus } from '@/domain'
import type { EtaView } from './eta'
import { hoursBetween, isAfter } from './time'

// BR-OT-01: `delta = ETA − plannedEta`, in hours.
const LATE_DELTA_HOURS = 12
const AT_RISK_DELTA_HOURS = 2
// BR-OT-01: the AI prediction alone flags `at_risk` past this margin and confidence.
const PREDICTED_AT_RISK_DELTA_HOURS = 12
const PREDICTED_AT_RISK_MIN_CONFIDENCE = 0.6
// BR-OT-02: a delivery up to this late still counts as on time.
const DELIVERY_GRACE_HOURS = 2

export interface OnTimeInput {
  eta: EtaView
  plannedEta: string
  deliveredAt: string | null
  prediction: { predictedEta: string; confidence: number } | null
  now: Date
}

export function deriveOnTime(input: OnTimeInput): OnTimeIndicator {
  const { eta, plannedEta, deliveredAt, prediction, now } = input
  // BR-OT-02.
  if (deliveredAt !== null) {
    return hoursBetween(plannedEta, deliveredAt) <= DELIVERY_GRACE_HOURS ? 'on_time' : 'late'
  }
  // BR-OT-01, first match wins.
  if (isAfter(now, plannedEta)) return 'late'
  if (eta.outdated) return 'unknown'
  const delta = hoursBetween(plannedEta, eta.value)
  if (delta > LATE_DELTA_HOURS) return 'late'
  if (delta > AT_RISK_DELTA_HOURS) return 'at_risk'
  if (prediction && predictsRisk(prediction, plannedEta)) return 'at_risk'
  return 'on_time'
}

function predictsRisk(
  prediction: { predictedEta: string; confidence: number },
  plannedEta: string,
): boolean {
  return (
    hoursBetween(plannedEta, prediction.predictedEta) > PREDICTED_AT_RISK_DELTA_HOURS &&
    prediction.confidence >= PREDICTED_AT_RISK_MIN_CONFIDENCE
  )
}

export interface AttentionItem {
  onTime: OnTimeIndicator
  status: ShipmentStatus
  eta: EtaView | null
}

// BR-OT-03: late → at_risk → on_hold → unknown → on_time, then by ETA ascending.
export function compareAttention(a: AttentionItem, b: AttentionItem): number {
  return attentionRank(a) - attentionRank(b) || compareEta(a, b)
}

// OP-22, 02 §5.2: a list of every shipment keeps delivered ones last, after the active ones in
// attention order; a delivery has nothing left to attend to.
export function compareActiveFirst(a: AttentionItem, b: AttentionItem): number {
  const delivered = Number(a.status === 'delivered') - Number(b.status === 'delivered')
  return delivered || compareAttention(a, b)
}

// An unknown ETA sorts last.
function compareEta(a: AttentionItem, b: AttentionItem): number {
  if (a.eta === null || b.eta === null) return Number(a.eta === null) - Number(b.eta === null)
  return Date.parse(a.eta.value) - Date.parse(b.eta.value)
}

function attentionRank({ onTime, status }: AttentionItem): number {
  if (onTime === 'late') return 0
  if (onTime === 'at_risk') return 1
  if (status === 'on_hold') return 2
  if (onTime === 'unknown') return 3
  return 4
}
