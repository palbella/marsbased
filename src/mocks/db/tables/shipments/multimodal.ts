import type { Clock } from '@/mocks/clock'
import type { ShipmentRow } from '../shipments'
import { LAST_MILE_ARRIVAL_AFTER_VESSEL_HOURS } from '../legs/multimodal'

// 07 §4, multimodal shipments to Corvane México. The committed date is the last-mile
// arrival of the booking template in legs/multimodal.ts, keyed by the planned vessel arrival,
// unless 07 sets it.
export function multimodalShipments({ hoursFromNow }: Clock): ShipmentRow[] {
  const deliveredAfterVessel = (vesselArrivalHours: number) =>
    hoursFromNow(vesselArrivalHours + LAST_MILE_ARRIVAL_AFTER_VESSEL_HOURS)

  return [
    // SH-10431: booked, pickup in 5 days, multimodal plan with customs.
    shipment('shp_013', 'SH-10431', 'site_bio', deliveredAfterVessel(490)),
    // SH-10432: at sea on BW Meridian, on schedule, arrival in 9 days → AI predicts at_risk.
    shipment('shp_014', 'SH-10432', 'site_zgz', deliveredAfterVessel(216)),
    // SH-10433: at sea, on schedule, arrival in 6 days, no `LOAD` reported (SIM-01).
    shipment('shp_015', 'SH-10433', 'site_zgz', deliveredAfterVessel(144)),
    // SH-10436: at sea, BWS `ETA` +30 h 2 h ago → late, `delay` high, customer not messaged.
    shipment('shp_016', 'SH-10436', 'site_vlc', deliveredAfterVessel(96)),
    // SH-10438: at sea, arrival in 40 h, commercial invoice pending → `missing_document` medium.
    shipment('shp_017', 'SH-10438', 'site_vlc', deliveredAfterVessel(40)),
    // SH-10441: `CHLD` 5 h ago, customs declaration pending → `hold` high, upload suggested.
    shipment('shp_018', 'SH-10441', 'site_vlc', deliveredAfterVessel(-30)),
    // SH-10444: `CSUB` 72 h ago, no clearance → `customs_incident`, waiting on operator;
    // committed in 3 days but 72 h of silence → on-time `unknown` (BR-ETA-05).
    shipment('shp_019', 'SH-10444', 'site_zgz', hoursFromNow(72)),
    // SH-10447: `CSUB` 6 h ago → in_customs (SIM-02).
    shipment('shp_020', 'SH-10447', 'site_vlc', deliveredAfterVessel(-7)),
    // SH-10450: last mile, out for delivery 2 h ago (SIM-04).
    shipment('shp_021', 'SH-10450', 'site_vlc', deliveredAfterVessel(-43)),
    // SH-10452: delivered 3 days ago, complete multimodal timeline.
    shipment('shp_022', 'SH-10452', 'site_zgz', deliveredAfterVessel(-120)),
  ]
}

function shipment(
  id: string,
  reference: string,
  originSiteId: string,
  plannedEta: string,
): ShipmentRow {
  return {
    id,
    reference,
    accountId: 'acc_005',
    originSiteId,
    destinationCity: 'Querétaro',
    destinationCountry: 'MX',
    plannedEta,
  }
}
