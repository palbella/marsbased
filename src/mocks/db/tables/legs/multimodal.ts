import type { Clock } from '@/mocks/clock'
import type { LegRow } from '../legs'
import { legId, trackingNumber } from './leg-ids'

// Booking template for the Mexico route (07 §4): road to Valencia port → sea to Veracruz →
// customs → last mile to Querétaro. Every leg date derives from the planned vessel arrival,
// so the shipments stay consistent with each other.
const SEA_TRANSIT_HOURS = 14 * 24
// Cargo reaches the port a day before sailing, after `loaded_on_vessel` is planned (BR-MS-03).
const PORT_ARRIVAL_BEFORE_SAILING_HOURS = 24
// The last mile leaves after the planned `customs_cleared` (vessel arrival + 24 h, BR-MS-03).
const LAST_MILE_DEPARTURE_AFTER_VESSEL_HOURS = 36
const LAST_MILE_HOURS = 12
export const LAST_MILE_ARRIVAL_AFTER_VESSEL_HOURS =
  LAST_MILE_DEPARTURE_AFTER_VESSEL_HOURS + LAST_MILE_HOURS
const ROAD_TO_PORT_HOURS: Record<MultimodalPlan['firstMileOperatorId'], number> = {
  op_tir: 8,
  op_pld: 2,
}

const VALENCIA_PORT = 'Port of Valencia'
const VERACRUZ_PORT = 'Port of Veracruz'

interface MultimodalPlan {
  shipmentId: string
  reference: string
  firstMileOperatorId: 'op_tir' | 'op_pld'
  origin: string
  vessel: string
  vesselArrivalInHours: number
  // Overrides the template when 07 sets the committed date (SH-10444).
  committedDeliveryInHours?: number
}

// Vessel arrival (and committed date, if set) in hours from now; must match
// shipments/multimodal.ts.
const MULTIMODAL_PLANS: MultimodalPlan[] = [
  plan('shp_013', '10431', 'op_tir', 'Bilbao Plant', 'BW Aurora', 490),
  plan('shp_014', '10432', 'op_tir', 'Zaragoza Plant', 'BW Meridian', 216),
  plan('shp_015', '10433', 'op_tir', 'Zaragoza Plant', 'BW Aurora', 144),
  plan('shp_016', '10436', 'op_pld', 'Valencia Warehouse', 'BW Aurora', 96),
  plan('shp_017', '10438', 'op_pld', 'Valencia Warehouse', 'BW Aurora', 40),
  plan('shp_018', '10441', 'op_pld', 'Valencia Warehouse', 'BW Aurora', -30),
  plan('shp_019', '10444', 'op_tir', 'Zaragoza Plant', 'BW Aurora', -73, 72),
  plan('shp_020', '10447', 'op_pld', 'Valencia Warehouse', 'BW Aurora', -7),
  plan('shp_021', '10450', 'op_pld', 'Valencia Warehouse', 'BW Aurora', -43),
  plan('shp_022', '10452', 'op_tir', 'Zaragoza Plant', 'BW Aurora', -120),
]

export function multimodalLegs(clock: Clock): LegRow[] {
  return MULTIMODAL_PLANS.flatMap((plan) => legsFor(plan, clock))
}

// Hours from now of each planned leg boundary.
function plannedHours(plan: MultimodalPlan) {
  const vesselArrival = plan.vesselArrivalInHours
  const sailing = vesselArrival - SEA_TRANSIT_HOURS
  const portArrival = sailing - PORT_ARRIVAL_BEFORE_SAILING_HOURS
  const lastMileArrival =
    plan.committedDeliveryInHours ?? vesselArrival + LAST_MILE_ARRIVAL_AFTER_VESSEL_HOURS
  return {
    portDeparture: portArrival - ROAD_TO_PORT_HOURS[plan.firstMileOperatorId],
    portArrival,
    sailing,
    vesselArrival,
    lastMileDeparture: lastMileArrival - LAST_MILE_HOURS,
    lastMileArrival,
  }
}

function legsFor(plan: MultimodalPlan, { hoursFromNow }: Clock): LegRow[] {
  const { portDeparture, portArrival, sailing, vesselArrival, lastMileDeparture, lastMileArrival } =
    plannedHours(plan)
  const leg = (sequence: number, operatorId: string, from: string, to: string) => ({
    id: legId(plan.shipmentId, sequence),
    shipmentId: plan.shipmentId,
    sequence,
    operatorId,
    from,
    to,
    trackingNumber: trackingNumber(operatorId, plan.reference),
  })

  return [
    {
      ...leg(1, plan.firstMileOperatorId, plan.origin, VALENCIA_PORT),
      mode: 'road',
      plannedDeparture: hoursFromNow(portDeparture),
      plannedArrival: hoursFromNow(portArrival),
      vessel: null,
    },
    {
      ...leg(2, 'op_bws', VALENCIA_PORT, VERACRUZ_PORT),
      mode: 'sea',
      plannedDeparture: hoursFromNow(sailing),
      plannedArrival: hoursFromNow(vesselArrival),
      vessel: plan.vessel,
    },
    {
      ...leg(3, 'op_lmx', VERACRUZ_PORT, 'Querétaro'),
      mode: 'road',
      plannedDeparture: hoursFromNow(lastMileDeparture),
      plannedArrival: hoursFromNow(lastMileArrival),
      vessel: null,
    },
  ]
}

function plan(
  shipmentId: string,
  reference: string,
  firstMileOperatorId: MultimodalPlan['firstMileOperatorId'],
  origin: string,
  vessel: string,
  vesselArrivalInHours: number,
  committedDeliveryInHours?: number,
): MultimodalPlan {
  return {
    shipmentId,
    reference,
    firstMileOperatorId,
    origin,
    vessel,
    vesselArrivalInHours,
    committedDeliveryInHours,
  }
}
