import type { DomainEvent } from '@/domain'
import type { Tables } from '@/mocks/db/schema'
import { createAlert, type Evaluation } from './alerts'
import { ensureProofOfDelivery } from './documents'
import { detectExceptions } from './exception-rules'
import { upsertExceptions } from './exception-upsert'
import { loadShipmentFacts, type ShipmentFacts } from './facts'
import { deriveShipment, type ShipmentView } from './shipment-view'
import { bookingTime } from './timeline'

// BR-EX-10: runs after every change to a shipment's facts and when the clock moves. Returns
// the changes as thin events (BR-RT-01) for the caller to publish; publishes nothing itself.
export function recompute(db: Tables, shipmentId: string, now: Date): DomainEvent[] {
  const facts = loadShipmentFacts(db, shipmentId)
  if (!facts) return []
  const view = deriveShipment(facts, now)
  const exceptions = upsertExceptions(db, facts, view, detectExceptions(view, facts, now), now)
  const previous = previousEvaluation(db, facts)
  const alert = createAlert(db, facts, view, previous, exceptions.raised, now)
  const evaluationChanged = saveEvaluation(db, view, previous, now)
  const proofOfDelivery = view.delivered ? ensureProofOfDelivery(db, shipmentId) : null

  const changes: DomainEvent[] = [...new Set(exceptions.changedIds)].map((exceptionId) => ({
    type: 'exception.changed',
    shipmentId,
    exceptionId,
  }))
  if (alert) changes.push({ type: 'alert.created', shipmentId, alertId: alert.id })
  if (proofOfDelivery) changes.push({ type: 'document.changed', shipmentId })
  if (evaluationChanged || changes.length > 0)
    changes.unshift({ type: 'shipment.updated', shipmentId })
  return changes
}

// BR-EX-10: the clock advanced or the data was reset.
export function recomputeAll(db: Tables, now: Date): DomainEvent[] {
  return db.shipments.all().flatMap((shipment) => recompute(db, shipment.id, now))
}

// BR-AL-01: a first evaluation compares against `on_time` and the committed date.
function previousEvaluation(db: Tables, facts: ShipmentFacts): Evaluation {
  const stored = db.shipmentEvaluations.findById(facts.shipment.id)
  if (stored) return stored
  return {
    onTime: 'on_time',
    status: 'booked',
    eta: {
      value: facts.shipment.plannedEta,
      provenance: 'estimated',
      source: 'booking',
      observedAt: bookingTime(facts.legs),
      outdated: false,
      rawEventId: null,
    },
  }
}

function saveEvaluation(db: Tables, view: ShipmentView, previous: Evaluation, now: Date): boolean {
  const evaluation = { onTime: view.onTime, eta: view.eta, status: view.status }
  const row = { id: view.shipmentId, ...evaluation, evaluatedAt: now.toISOString() }
  if (db.shipmentEvaluations.findById(view.shipmentId)) {
    db.shipmentEvaluations.update(view.shipmentId, row)
  } else {
    db.shipmentEvaluations.insert(row)
  }
  return !sameEvaluation(evaluation, previous)
}

function sameEvaluation(a: Evaluation, b: Evaluation): boolean {
  return (
    a.onTime === b.onTime &&
    a.status === b.status &&
    a.eta.value === b.eta.value &&
    a.eta.provenance === b.eta.provenance &&
    a.eta.source === b.eta.source &&
    a.eta.outdated === b.eta.outdated
  )
}
