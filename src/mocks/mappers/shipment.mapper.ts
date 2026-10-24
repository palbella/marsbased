import type { Leg, Shipment } from '@/domain'
import type { LegRow } from '@/mocks/db/tables/legs'
import { findOperator, type ShipmentFacts } from '@/mocks/engine/facts'
import type { LoadedShipment } from '@/mocks/queries/shipment-loader'
import { etaBasis } from './eta-basis'

// `openExceptionCount` is passed for ops only: customers never see exceptions (CP-16).
export function toShipmentResponse(
  { facts, view, now }: LoadedShipment,
  openExceptionCount?: number,
): Shipment {
  const { shipment, account, originSite, legs } = facts
  return {
    id: shipment.id,
    reference: shipment.reference,
    accountId: account.id,
    accountName: account.name,
    originSiteId: originSite.id,
    originSiteName: originSite.name,
    destination: {
      city: shipment.destinationCity,
      country: shipment.destinationCountry,
      international: view.international,
    },
    legs: legs.map((leg) => toLegResponse(leg, facts)),
    currentLegId: view.currentLeg.id,
    status: view.status,
    eta: { ...view.eta, basis: etaBasis(view.eta, { facts, view }, now) },
    plannedEta: shipment.plannedEta,
    onTime: view.onTime,
    lastEventAt: view.lastEventAt,
    stale: view.staleness.stale,
    hasCustoms: view.hasCustoms,
    lastDoneMilestone: view.latestDone && {
      type: view.latestDone.type,
      // The customs block sits between legs (BR-MS-02), as in the timeline.
      legId: view.latestDone.customs ? null : view.latestDone.legId,
    },
    ...(openExceptionCount === undefined ? {} : { openExceptionCount }),
  }
}

function toLegResponse(leg: LegRow, facts: ShipmentFacts): Leg {
  return {
    id: leg.id,
    sequence: leg.sequence,
    mode: leg.mode,
    operatorId: leg.operatorId,
    operatorName: findOperator(facts, leg.operatorId)?.name ?? leg.operatorId,
    from: leg.from,
    to: leg.to,
    plannedDeparture: leg.plannedDeparture,
    plannedArrival: leg.plannedArrival,
    trackingNumber: leg.trackingNumber,
    vessel: leg.vessel,
  }
}
