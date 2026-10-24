import type { DraftMessageInsight, Evidence, ExceptionType } from '@/domain'
import type { ExceptionRow } from '@/mocks/db/tables/exceptions'
import type { ShipmentFacts } from '@/mocks/engine/facts'
import type { ShipmentView } from '@/mocks/engine/shipment-view'
import { hoursBetween } from '@/mocks/engine/time'
import { describeEtaSource, formatDay, formatDuration, operatorName } from './format'
import { insight, rawEventEvidence } from './insight'

// BR-AI-03.
const CONFIDENCE = 0.8
const SIGN_OFF = 'Kind regards,\nCorvane Industrial logistics team'
const NO_ACTION_NEEDED = 'No action is needed from you; we will keep you informed.'

interface Template {
  subject: string
  happened: string
}

// BR-AI-03 (AI-3): a formal message per exception type, from the shipment's facts only. It is
// a proposal: the agent edits it and nothing is sent without their confirmation (P3).
export function draftMessage(
  exception: ExceptionRow,
  facts: ShipmentFacts,
  view: ShipmentView,
  now: Date,
): DraftMessageInsight {
  const { reference } = facts.shipment
  const { subject, happened } = TEMPLATES[exception.type](facts, view, now)
  const etaLine = `The committed delivery date was ${formatDay(facts.shipment.plannedEta)}; the current estimate is ${formatDay(view.eta.value)} (${describeEtaSource(view.eta, facts)}).`
  const message = ['Dear customer,', `${happened} ${etaLine}`, NO_ACTION_NEEDED, SIGN_OFF].join(
    '\n\n',
  )
  const evidence: Evidence[] = [
    { text: `Open ${exception.type.replaceAll('_', ' ')} exception (${exception.severity})` },
    rawEventEvidence(`Current ETA ${formatDay(view.eta.value)}`, view.eta.rawEventId),
  ]
  return insight(
    'draft',
    { subject: `${reference}: ${subject}`, message, requiresAction: false },
    CONFIDENCE,
    evidence,
    now,
  )
}

type TemplateBuilder = (facts: ShipmentFacts, view: ShipmentView, now: Date) => Template

const TEMPLATES: Record<ExceptionType, TemplateBuilder> = {
  delay: ({ shipment }, view) => ({
    subject: 'updated delivery estimate',
    happened: `Your shipment ${shipment.reference} to ${shipment.destinationCity} is running about ${formatDuration(view.etaDeltaHours)} behind schedule.`,
  }),
  hold: (facts, view) => ({
    subject: 'customs hold',
    happened: `Customs has put shipment ${facts.shipment.reference} on hold. We are working with ${operatorName(facts, view.currentLeg.operatorId)} to release it as soon as possible.`,
  }),
  customs_incident: ({ shipment }) => ({
    subject: 'customs clearance taking longer',
    happened: `Customs clearance of shipment ${shipment.reference} is taking longer than expected. We are following up with the carrier.`,
  }),
  stale: ({ shipment }, view) => ({
    subject: 'tracking update pending',
    happened: `We have not received a tracking update for shipment ${shipment.reference} in the last ${formatDuration(view.staleness.silentHours ?? 0)}. We have asked the carrier for its position.`,
  }),
  missing_document: ({ shipment }, view, now) => ({
    subject: 'customs documents in progress',
    happened: `We are completing the customs documents for shipment ${shipment.reference} ahead of its customs submission ${customsTiming(view, now)}.`,
  }),
}

function customsTiming(view: ShipmentView, now: Date): string {
  const planned = view.milestones.find((milestone) => milestone.type === 'customs_submitted')
  if (!planned || hoursBetween(now, planned.plannedAt) <= 0) return 'at destination'
  return `on ${formatDay(planned.plannedAt)}`
}
