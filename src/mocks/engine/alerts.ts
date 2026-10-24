import type { AlertType, ExceptionType } from '@/domain'
import type { Tables } from '@/mocks/db/schema'
import type { AlertRow } from '@/mocks/db/tables/alerts'
import type { ShipmentEvaluationRow } from '@/mocks/db/tables/shipment-evaluations'
import { alertContent, asSourcedDate } from './alert-content'
import type { ExceptionChanges } from './exception-upsert'
import type { ShipmentFacts } from './facts'
import { nextId } from './records'
import type { ShipmentView } from './shipment-view'
import { hoursBetween, isAfter } from './time'

// BR-AL-01: the ETA moved more than this from the last alerted one.
const ETA_CHANGED_ABOVE_HOURS = 12
// BR-AL-05, most important first. `delivered` ends the journey, so it is alone (see below).
const ALERT_PRIORITY = ['on_hold', 'customs_issue', 'late', 'at_risk', 'eta_changed'] as const
type InTransitAlert = (typeof ALERT_PRIORITY)[number]
// BR-AL-01: alerts raised with the exception that opens them. BR-AL-02: never `stale` or
// `missing_document`.
const ALERT_FOR_EXCEPTION: Partial<Record<ExceptionType, InTransitAlert>> = {
  hold: 'on_hold',
  customs_incident: 'customs_issue',
}

export type Evaluation = Pick<ShipmentEvaluationRow, 'onTime' | 'eta' | 'status'>

interface TriggerContext {
  alerts: AlertRow[]
  view: ShipmentView
  previous: Evaluation
  raised: ExceptionChanges['raised']
  plannedEta: string
}

// BR-AL-01..05: at most one alert per recomputation, for the shipment's account.
export function createAlert(
  db: Tables,
  facts: ShipmentFacts,
  view: ShipmentView,
  previous: Evaluation,
  raised: ExceptionChanges['raised'],
  now: Date,
): AlertRow | null {
  const alerts = db.alerts.where((row) => row.shipmentId === facts.shipment.id)
  const context = { alerts, view, previous, raised, plannedEta: facts.shipment.plannedEta }
  const type = view.delivered
    ? deliveredTrigger(context)
    : ALERT_PRIORITY.find((candidate) => triggers(candidate, context))
  if (!type) return null
  const { title, message } = alertContent(type, facts, view, asSourcedDate(previous.eta))
  return db.alerts.insert({
    id: nextId(db.alerts, 'alr'),
    shipmentId: facts.shipment.id,
    accountId: facts.shipment.accountId,
    type,
    title,
    message,
    etaImpact: { previousEta: asSourcedDate(previous.eta), newEta: asSourcedDate(view.eta) },
    requiresAction: false,
    createdAt: now.toISOString(),
    readAt: null,
  })
}

// `delivered` replaces every in-transit trigger of the same recomputation.
function deliveredTrigger({ alerts, view, previous }: TriggerContext) {
  const isNew = previous.status !== 'delivered' && !alreadyAlerted(alerts, 'delivered', view)
  return isNew ? ('delivered' as const) : undefined
}

function triggers(type: InTransitAlert, context: TriggerContext): boolean {
  const { alerts, view, previous, raised } = context
  switch (type) {
    case 'on_hold':
    case 'customs_issue':
      return raised.some(
        ({ exception, detected }) =>
          ALERT_FOR_EXCEPTION[exception.type] === type &&
          !alertedSince(alerts, type, triggerTime(view, detected.rawEventId)),
      )
    case 'late':
      return (
        view.onTime === 'late' && previous.onTime !== 'late' && !alreadyAlerted(alerts, type, view)
      )
    case 'at_risk':
      return (
        view.onTime === 'at_risk' &&
        previous.onTime === 'on_time' &&
        !alreadyAlerted(alerts, type, view)
      )
    case 'eta_changed':
      return etaMoved(context) && !alreadyAlerted(alerts, type, view)
  }
}

// BR-AL-04, ETA-based alerts: one per (shipment, type, new ETA).
function alreadyAlerted(alerts: AlertRow[], type: AlertType, view: ShipmentView): boolean {
  return alerts.some(
    (alert) => alert.type === type && alert.etaImpact?.newEta?.value === view.eta.value,
  )
}

// BR-AL-04, hold and incident alerts: one per triggering raw event, so none since it arrived.
function alertedSince(alerts: AlertRow[], type: AlertType, since: string | null): boolean {
  return alerts.some(
    (alert) => alert.type === type && (since === null || !isAfter(since, alert.createdAt)),
  )
}

function triggerTime(view: ShipmentView, rawEventId: string | null): string | null {
  const hold = view.holds.find((candidate) => candidate.rawEventId === rawEventId)
  const milestone = view.milestones.find((candidate) => candidate.rawEventId === rawEventId)
  return hold?.reportedAt.observedAt ?? milestone?.actual?.observedAt ?? null
}

// BR-AL-01 `eta_changed`: against the ETA of the last alert sent, or the committed date.
function etaMoved({ alerts, view, plannedEta }: TriggerContext): boolean {
  const lastAlerted = alerts.findLast((alert) => alert.etaImpact?.newEta)?.etaImpact?.newEta
  const baseline = lastAlerted?.value ?? plannedEta
  return Math.abs(hoursBetween(baseline, view.eta.value)) > ETA_CHANGED_ABOVE_HOURS
}
