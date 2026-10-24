import type { AlertType, SourcedDate } from '@/domain'
import type { EtaView } from './eta'
import { findOperator, type ShipmentFacts } from './facts'
import type { ShipmentView } from './shipment-view'
import { hoursBetween } from './time'

export interface AlertContent {
  title: string
  message: string
}

type AutomaticAlertType = Exclude<AlertType, 'message'>

const hours = (value: number) => `${Math.abs(Math.round(value))} h`

// BR-AL-03: what happened, in customer terms. The ETA impact travels separately.
export function alertContent(
  type: AutomaticAlertType,
  facts: ShipmentFacts,
  view: ShipmentView,
  previousEta: SourcedDate,
): AlertContent {
  const reference = facts.shipment.reference
  const operatorName = findOperator(facts, view.currentLeg.operatorId)?.name ?? 'the carrier'
  const behind = `Delivery is now expected about ${hours(view.etaDeltaHours)} after the committed date.`
  switch (type) {
    case 'at_risk':
      return { title: `${reference} may arrive late`, message: atRiskMessage(facts, view, behind) }
    case 'late':
      return {
        title: `${reference} is running late`,
        message: view.etaDeltaHours > 0 ? behind : 'The committed delivery date has passed.',
      }
    case 'eta_changed': {
      const moved = hoursBetween(previousEta.value, view.eta.value)
      const direction = moved > 0 ? 'later' : 'earlier'
      return {
        title: `New ETA for ${reference}`,
        message: `The expected delivery moved about ${hours(moved)} ${direction}.`,
      }
    }
    case 'on_hold':
      return {
        title: `${reference} is on hold at customs`,
        message: `Customs has put the shipment on hold. We are working with ${operatorName} to release it.`,
      }
    case 'customs_issue':
      return {
        title: `Customs clearance delayed for ${reference}`,
        message: 'Customs has not cleared the shipment yet. We are following up with the carrier.',
      }
    case 'delivered':
      return { title: `${reference} delivered`, message: 'Your shipment has been delivered.' }
  }
}

// `at_risk` comes from the ETA (BR-OT-01) or, with an on-time ETA, from the AI prediction.
function atRiskMessage(facts: ShipmentFacts, view: ShipmentView, behind: string): string {
  if (view.etaDeltaHours > 0 || !view.prediction) return behind
  const predicted = hoursBetween(facts.shipment.plannedEta, view.prediction.predictedEta)
  return `The current ETA is on time, but our prediction points to about ${hours(predicted)} of delay.`
}

// The ETA impact carries plain sourced dates (BR-AL-03).
export function asSourcedDate({ value, provenance, source, observedAt }: EtaView): SourcedDate {
  return { value, provenance, source, observedAt }
}
