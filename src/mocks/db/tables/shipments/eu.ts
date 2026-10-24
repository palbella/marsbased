import type { Clock } from '@/mocks/clock'
import type { ShipmentRow } from '../shipments'

// 07 §4, EU road shipments (a single leg, international without customs, BR-MS-02).
export function euShipments({ hoursFromNow }: Clock): ShipmentRow[] {
  return [
    // SH-10411: in transit, `NEWETA` +30 h and a `RET-PLAT` → late, `delay` high.
    shipment('shp_010', 'SH-10411', 'site_zgz', 'Toulouse', hoursFromNow(10)),
    // SH-10412: delivered 3 days ago.
    shipment('shp_011', 'SH-10412', 'site_bio', 'Bordeaux', hoursFromNow(-72)),
    // SH-10421: in transit, last event 11 h ago, ETA in 20 h, on time (SIM-03).
    shipment('shp_012', 'SH-10421', 'site_bcn', 'Lyon', hoursFromNow(20)),
  ]
}

// Every EU shipment in 07 goes to Durand Équipements, in France.
function shipment(
  id: string,
  reference: string,
  originSiteId: string,
  destinationCity: string,
  plannedEta: string,
): ShipmentRow {
  return {
    id,
    reference,
    accountId: 'acc_004',
    originSiteId,
    destinationCity,
    destinationCountry: 'FR',
    plannedEta,
  }
}
