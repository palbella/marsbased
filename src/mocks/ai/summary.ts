import type { Evidence, ShipmentSummaryInsight } from '@/domain'
import { detectExceptions } from '@/mocks/engine/exception-rules'
import type { ShipmentFacts } from '@/mocks/engine/facts'
import type { ShipmentView } from '@/mocks/engine/shipment-view'
import { describeEtaSource, formatDay, formatDuration } from './format'
import { insight, milestoneEvidence, rawEventEvidence } from './insight'
import { nextStepName, positionAfter } from './milestone-phrases'

// BR-AI-01.
const CONFIDENCE = 0.9
const STALE_CONFIDENCE = 0.6
// Within the at-risk margin of BR-OT-01, the shipment reads as on schedule.
const ON_SCHEDULE_WITHIN_HOURS = 2

interface Sentence {
  text: string
  evidence: Evidence[]
}

// BR-AI-01 (AI-1): where it is, timing against the committed date, the ETA with its source and
// the next milestone; plus a plain explanation of an open hold or customs incident.
export function summarise(
  facts: ShipmentFacts,
  view: ShipmentView,
  now: Date,
): ShipmentSummaryInsight {
  const sentences = [
    position(facts, view),
    arrival(facts, view),
    ...(view.delivered ? [] : [nextStep(facts, view)]),
    customsExplanation(facts, view, now),
  ].filter((sentence) => sentence !== null)
  return insight(
    'summary',
    { text: sentences.map((sentence) => sentence.text).join(' ') },
    view.staleness.stale ? STALE_CONFIDENCE : CONFIDENCE,
    sentences.flatMap((sentence) => sentence.evidence),
    now,
  )
}

function position(facts: ShipmentFacts, view: ShipmentView): Sentence {
  const latest = view.latestDone
  if (!latest) {
    return { text: 'Your order is booked and waiting for pickup.', evidence: [] }
  }
  const leg = legOf(facts, latest.legId)
  const where = `Your order ${positionAfter(latest.type, leg)}`
  return {
    text: view.delivered ? `${where}.` : `${where}, ${timing(view)}.`,
    evidence: [milestoneEvidence(`${latest.type.replaceAll('_', ' ')} reported`, latest)],
  }
}

function timing(view: ShipmentView): string {
  if (Math.abs(view.etaDeltaHours) <= ON_SCHEDULE_WITHIN_HOURS) return 'on schedule'
  const direction = view.etaDeltaHours > 0 ? 'behind' : 'ahead of'
  return `about ${formatDuration(view.etaDeltaHours)} ${direction} plan`
}

function arrival(facts: ShipmentFacts, view: ShipmentView): Sentence {
  const { eta } = view
  const day = formatDay(eta.value)
  const text = view.delivered
    ? `Delivered ${day}, ${view.onTime === 'on_time' ? 'on time' : 'later than committed'}.`
    : `Expected delivery ${day} (${describeEtaSource(eta, facts)}).`
  const outdated = eta.outdated ? ' We have had no recent update, so this date may change.' : ''
  return {
    text: text + outdated,
    evidence: [rawEventEvidence(`ETA ${day}, ${describeEtaSource(eta, facts)}`, eta.rawEventId)],
  }
}

function nextStep(facts: ShipmentFacts, view: ShipmentView): Sentence | null {
  const latestIndex = view.latestDone ? view.milestones.indexOf(view.latestDone) : -1
  const next = view.milestones.slice(latestIndex + 1).find((m) => m.state !== 'not_reported')
  if (!next) return null
  const name = nextStepName(next.type, legOf(facts, next.legId))
  return {
    text: `Next: ${name}.`,
    evidence: [
      milestoneEvidence(`Next milestone: ${name}, planned ${formatDay(next.plannedAt)}`, next),
    ],
  }
}

function customsExplanation(facts: ShipmentFacts, view: ShipmentView, now: Date): Sentence | null {
  const open = view.holds.find((hold) => hold.open)
  if (open) {
    return {
      text: 'Customs has put it on hold; we are working with the carrier to release it.',
      evidence: [rawEventEvidence('Customs hold reported', open.rawEventId)],
    }
  }
  const incident = detectExceptions(view, facts, now).find((e) => e.type === 'customs_incident')
  if (!incident) return null
  return {
    text: 'Customs clearance is taking longer than usual; we are following up.',
    evidence: [rawEventEvidence(incident.reason, incident.rawEventId)],
  }
}

function legOf(facts: ShipmentFacts, legId: string) {
  return facts.legs.find((leg) => leg.id === legId) ?? facts.legs[0]
}
