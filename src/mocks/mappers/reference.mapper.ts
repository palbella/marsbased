import type { ReferenceData } from '@/domain'
import type { Tables } from '@/mocks/db/schema'
import type { ShipmentRow } from '@/mocks/db/tables/shipments'

// OP-21: filter options are only what the perimeter's shipments use, so a filter never
// offers a site, operator or account the user cannot see.
export function toReferenceResponse(db: Tables, shipments: ShipmentRow[]): ReferenceData {
  const shipmentIds = new Set(shipments.map((shipment) => shipment.id))
  const siteIds = new Set(shipments.map((shipment) => shipment.originSiteId))
  const accountIds = new Set(shipments.map((shipment) => shipment.accountId))
  const operatorIds = new Set(
    db.legs.where((leg) => shipmentIds.has(leg.shipmentId)).map((leg) => leg.operatorId),
  )
  return {
    sites: db.sites.where((site) => siteIds.has(site.id)),
    operators: db.operators
      .where((operator) => operatorIds.has(operator.id))
      .map(({ id, name, mode }) => ({ id, name, mode })),
    accounts: db.accounts.where((account) => accountIds.has(account.id)),
  }
}
