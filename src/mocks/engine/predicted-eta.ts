import type { LegRow } from '@/mocks/db/tables/legs'
import type { OperatorRow } from '@/mocks/db/tables/operators'
import { addHours, hoursBetween } from './time'

// BR-AI-05: confidence `0.85 − 0.1 × remaining sea legs`, minus 0.1 if stale, minimum 0.4.
const BASE_CONFIDENCE = 0.85
const CONFIDENCE_LOSS_PER_SEA_LEG = 0.1
const CONFIDENCE_LOSS_IF_STALE = 0.1
const MIN_CONFIDENCE = 0.4
// An operator or vessel with no history adds no delay.
const NEUTRAL_DELAY_FACTOR = 1

export interface LegPrediction {
  leg: LegRow
  remainingPlannedHours: number
  delayFactor: number
  delayHours: number
}

export interface EtaPrediction {
  predictedEta: string
  delayHours: number
  confidence: number
  legs: LegPrediction[]
}

export interface PredictionInput {
  legs: LegRow[]
  operators: OperatorRow[]
  currentLegId: string
  eta: string
  stale: boolean
  now: Date
}

// BR-AI-05: each remaining leg adds its planned hours left times its delay factor − 1.
export function predictEta(input: PredictionInput): EtaPrediction {
  const currentIndex = input.legs.findIndex((leg) => leg.id === input.currentLegId)
  const remaining = input.legs.slice(Math.max(0, currentIndex))
  const legs = remaining.map((leg): LegPrediction => {
    const remainingPlannedHours =
      leg.id === input.currentLegId ? hoursLeft(leg, input.now) : plannedHours(leg)
    const delayFactor = delayFactorOf(leg, input.operators)
    return {
      leg,
      remainingPlannedHours,
      delayFactor,
      delayHours: remainingPlannedHours * (delayFactor - 1),
    }
  })
  const delayHours = legs.reduce((total, leg) => total + leg.delayHours, 0)
  const seaLegs = remaining.filter((leg) => leg.mode === 'sea').length
  const confidence =
    BASE_CONFIDENCE -
    CONFIDENCE_LOSS_PER_SEA_LEG * seaLegs -
    (input.stale ? CONFIDENCE_LOSS_IF_STALE : 0)
  return {
    predictedEta: addHours(input.eta, delayHours),
    delayHours,
    // Rounded so 0.85 − 0.1 reads 0.75, not 0.7499999.
    confidence: Math.round(Math.max(MIN_CONFIDENCE, confidence) * 100) / 100,
    legs,
  }
}

// The per-vessel factor for sea legs when known, else the operator's default (07 §3).
export function delayFactorOf(leg: LegRow, operators: OperatorRow[]): number {
  const factors = operators.find((operator) => operator.id === leg.operatorId)?.delayFactors ?? []
  const forVessel = factors.find((factor) => factor.vessel !== null && factor.vessel === leg.vessel)
  const fallback = factors.find((factor) => factor.vessel === null)
  return forVessel?.factor ?? fallback?.factor ?? NEUTRAL_DELAY_FACTOR
}

// `plannedArrival − max(now, plannedDeparture)`, never negative.
function hoursLeft(leg: LegRow, now: Date): number {
  const from = hoursBetween(leg.plannedDeparture, now) > 0 ? now : leg.plannedDeparture
  return Math.max(0, hoursBetween(from, leg.plannedArrival))
}

function plannedHours(leg: LegRow): number {
  return hoursBetween(leg.plannedDeparture, leg.plannedArrival)
}
