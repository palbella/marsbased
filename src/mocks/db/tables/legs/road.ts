import type { Clock } from '@/mocks/clock'
import type { LegRow } from '../legs'
import { legId, trackingNumber } from './leg-ids'

interface RoadLegPlan {
  shipmentId: string
  reference: string
  operatorId: string
  from: string
  to: string
  departsInHours: number
  arrivesInHours: number
}

// 07 §4: domestic and EU shipments are a single road leg. Arrival = committed date.
const ROAD_LEG_PLANS: RoadLegPlan[] = [
  plan('shp_001', '10401', 'op_tir', 'Zaragoza Plant', 'Madrid', -3, 10),
  plan('shp_002', '10402', 'op_eur', 'Barcelona Warehouse', 'Sevilla', -10, 4),
  plan('shp_003', '10403', 'op_tir', 'Bilbao Plant', 'Valencia', -32, -24),
  plan('shp_004', '10404', 'op_eur', 'Zaragoza Plant', 'Málaga', -6, 10),
  plan('shp_005', '10405', 'op_tir', 'Valencia Warehouse', 'Madrid', -59, -51),
  plan('shp_006', '10406', 'op_eur', 'Bilbao Plant', 'Barcelona', -15, 10),
  plan('shp_007', '10407', 'op_tir', 'Zaragoza Plant', 'Bilbao', 26, 31),
  plan('shp_008', '10408', 'op_eur', 'Barcelona Warehouse', 'Zaragoza', -4, 10),
  plan('shp_009', '10409', 'op_tir', 'Valencia Warehouse', 'Murcia', -4, 10),
  plan('shp_010', '10411', 'op_eur', 'Zaragoza Plant', 'Toulouse', -5, 10),
  plan('shp_011', '10412', 'op_tir', 'Bilbao Plant', 'Bordeaux', -80, -72),
  plan('shp_012', '10421', 'op_eur', 'Barcelona Warehouse', 'Lyon', -11, 20),
]

export function roadLegs({ hoursFromNow }: Clock): LegRow[] {
  return ROAD_LEG_PLANS.map((leg): LegRow => ({
    id: legId(leg.shipmentId, 1),
    shipmentId: leg.shipmentId,
    sequence: 1,
    mode: 'road',
    operatorId: leg.operatorId,
    from: leg.from,
    to: leg.to,
    plannedDeparture: hoursFromNow(leg.departsInHours),
    plannedArrival: hoursFromNow(leg.arrivesInHours),
    trackingNumber: trackingNumber(leg.operatorId, leg.reference),
    vessel: null,
  }))
}

function plan(
  shipmentId: string,
  reference: string,
  operatorId: string,
  from: string,
  to: string,
  departsInHours: number,
  arrivesInHours: number,
): RoadLegPlan {
  return { shipmentId, reference, operatorId, from, to, departsInHours, arrivesInHours }
}
