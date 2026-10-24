import type { Tables } from '@/mocks/db/schema'
import type { AccountRow } from '@/mocks/db/tables/accounts'
import type { DocumentRow } from '@/mocks/db/tables/documents'
import type { LegRow } from '@/mocks/db/tables/legs'
import type { OperatorRow } from '@/mocks/db/tables/operators'
import type { ShipmentRow } from '@/mocks/db/tables/shipments'
import type { SiteRow } from '@/mocks/db/tables/sites'
import { normaliseEvents, type NormalisedEvent } from '@/mocks/operators/normalise'

// 02 §5.5 rule 4: the stored facts of one shipment, from which everything else is derived.
export type Legs = [LegRow, ...LegRow[]]

export interface ShipmentFacts {
  shipment: ShipmentRow
  account: AccountRow
  originSite: SiteRow
  // In sequence order; a shipment has at least one leg (02 §6.2).
  legs: Legs
  operators: OperatorRow[]
  // Normalised and in `occurredAt` order (04 §2).
  events: NormalisedEvent[]
  documents: DocumentRow[]
}

export function loadShipmentFacts(db: Tables, shipmentId: string): ShipmentFacts | null {
  const shipment = db.shipments.findById(shipmentId)
  if (!shipment) return null
  const account = db.accounts.findById(shipment.accountId)
  const originSite = db.sites.findById(shipment.originSiteId)
  if (!account || !originSite) return null

  const [firstLeg, ...laterLegs] = db.legs
    .where((leg) => leg.shipmentId === shipmentId)
    .sort((a, b) => a.sequence - b.sequence)
  if (!firstLeg) return null
  const legs: Legs = [firstLeg, ...laterLegs]
  const legIds = new Set(legs.map((leg) => leg.id))
  const operators = db.operators.all()
  const rows = db.rawEvents.where((event) => legIds.has(event.legId))
  return {
    shipment,
    account,
    originSite,
    legs,
    operators,
    events: normaliseEvents(rows, operators, db.statusMappings.all()),
    documents: db.documents.where((document) => document.shipmentId === shipmentId),
  }
}

export function findOperator(facts: ShipmentFacts, operatorId: string): OperatorRow | undefined {
  return facts.operators.find((operator) => operator.id === operatorId)
}
