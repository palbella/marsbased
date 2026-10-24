import type { Clock } from '@/mocks/clock'
import type { ShipmentRow } from '../shipments'

// 07 §4, domestic road shipments (a single leg).
export function domesticShipments({ hoursFromNow }: Clock): ShipmentRow[] {
  return [
    // SH-10401: in transit, departed 3 h ago, ETA in 10 h, on time (SIM-05).
    shipment('shp_001', 'SH-10401', 'acc_001', 'site_zgz', 'Madrid', hoursFromNow(10)),
    // SH-10402: out for delivery since 1 h ago, ETA in 4 h, on time.
    shipment('shp_002', 'SH-10402', 'acc_001', 'site_bcn', 'Sevilla', hoursFromNow(4)),
    // SH-10403: delivered yesterday, on time, with POD.
    shipment('shp_003', 'SH-10403', 'acc_001', 'site_bio', 'Valencia', hoursFromNow(-24)),
    // SH-10404: in transit, departed 5 h late → at_risk (+5 h).
    shipment('shp_004', 'SH-10404', 'acc_001', 'site_zgz', 'Málaga', hoursFromNow(10)),
    // SH-10405: delivered 2 days ago, 4 h late.
    shipment('shp_005', 'SH-10405', 'acc_002', 'site_vlc', 'Madrid', hoursFromNow(-51)),
    // SH-10406: in transit, last event 15 h ago → stale.
    shipment('shp_006', 'SH-10406', 'acc_002', 'site_bio', 'Barcelona', hoursFromNow(10)),
    // SH-10407: booked, pickup tomorrow, planned-only timeline.
    shipment('shp_007', 'SH-10407', 'acc_002', 'site_zgz', 'Bilbao', hoursFromNow(31)),
    // SH-10408: in transit, last event an unmapped `RET-PLAT` 3 h ago.
    shipment('shp_008', 'SH-10408', 'acc_003', 'site_bcn', 'Zaragoza', hoursFromNow(10)),
    // SH-10409: in transit, operator ETA update +16 h → late, `delay` medium.
    shipment('shp_009', 'SH-10409', 'acc_003', 'site_vlc', 'Murcia', hoursFromNow(10)),
  ]
}

function shipment(
  id: string,
  reference: string,
  accountId: string,
  originSiteId: string,
  destinationCity: string,
  plannedEta: string,
): ShipmentRow {
  return {
    id,
    reference,
    accountId,
    originSiteId,
    destinationCity,
    destinationCountry: 'ES',
    plannedEta,
  }
}
