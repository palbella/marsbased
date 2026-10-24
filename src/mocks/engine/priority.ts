import { MAX_PRIORITY_SCORE, type Severity } from '@/domain'
import type { ActivityRow } from '@/mocks/db/tables/activity'
import type { ExceptionRow } from '@/mocks/db/tables/exceptions'
import type { ShipmentFacts } from './facts'
import type { ShipmentView } from './shipment-view'
import { hoursBetween } from './time'

// BR-PR-01 factors.
const SEVERITY_FACTOR: Record<Severity, number> = { high: 3, medium: 2, low: 1 }
const BASE_IMPACT = 1
const KEY_ACCOUNT_IMPACT = 0.5
const INTERNATIONAL_IMPACT = 0.5
const URGENT_ETA_HOURS = 24
const URGENT_FACTOR = 1.5
const SOON_ETA_HOURS = 72
const SOON_FACTOR = 1.2
const NEUTRAL_FACTOR = 1
const UNATTENDED_AFTER_HOURS = 24
const UNATTENDED_FACTOR = 1.2
const SCORE_SCALE = 10

export interface PriorityFactors {
  severity: number
  impact: number
  urgency: number
  age: number
}

export interface Priority {
  score: number
  factors: PriorityFactors
  // BR-PR-03: each factor that raised the score, in words.
  labels: string[]
}

// BR-PR-01, BR-PR-03.
export function scorePriority(
  exception: ExceptionRow,
  facts: ShipmentFacts,
  view: ShipmentView,
  activity: ActivityRow[],
  now: Date,
): Priority {
  const keyAccount = facts.account.tier === 'key'
  const etaInHours = hoursBetween(now, view.eta.value)
  const openHours = hoursBetween(exception.detectedAt, now)
  const unattended = openHours > UNATTENDED_AFTER_HOURS && !hasAction(exception, activity)
  const factors: PriorityFactors = {
    severity: SEVERITY_FACTOR[exception.severity],
    impact:
      BASE_IMPACT +
      (keyAccount ? KEY_ACCOUNT_IMPACT : 0) +
      (view.international ? INTERNATIONAL_IMPACT : 0),
    urgency: urgencyFactor(etaInHours),
    age: unattended ? UNATTENDED_FACTOR : NEUTRAL_FACTOR,
  }
  const product = factors.severity * factors.impact * factors.urgency * factors.age
  const labels = [
    `${capitalise(exception.severity)} severity`,
    ...(keyAccount ? ['Key account'] : []),
    ...(view.international ? ['International'] : []),
    ...(factors.urgency > NEUTRAL_FACTOR ? [etaLabel(etaInHours)] : []),
    ...(unattended ? [`Open ${Math.round(openHours)} h without action`] : []),
  ]
  return { score: Math.min(MAX_PRIORITY_SCORE, Math.round(product * SCORE_SCALE)), factors, labels }
}

// BR-PR-02: score descending, then the older exception first.
export function comparePriority(
  a: { score: number; detectedAt: string },
  b: { score: number; detectedAt: string },
): number {
  return b.score - a.score || a.detectedAt.localeCompare(b.detectedAt)
}

function urgencyFactor(etaInHours: number): number {
  if (etaInHours < URGENT_ETA_HOURS) return URGENT_FACTOR
  if (etaInHours < SOON_ETA_HOURS) return SOON_FACTOR
  return NEUTRAL_FACTOR
}

function etaLabel(etaInHours: number): string {
  return etaInHours < 0 ? 'ETA passed' : `ETA in ${Math.round(etaInHours)} h`
}

// An action is anything an agent did on the exception (BR-AC-*), not the engine's entries.
function hasAction(exception: ExceptionRow, activity: ActivityRow[]): boolean {
  return activity.some((entry) => entry.exceptionId === exception.id && entry.userId !== null)
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
