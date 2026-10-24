import type {
  CustomsHold,
  Leg,
  MilestoneType,
  Shipment,
  ShipmentStatus,
  SourcedDate,
  Timeline,
} from '@/domain'

// Component-test fixtures: one shipment per route type in 07 §4, built from domain types
// only (features never see the mock backend).

export const FIXTURE_NOW = new Date('2026-11-12T12:00:00.000Z')
const MS_PER_HOUR = 3_600_000

export function hoursFromNow(hours: number): string {
  return new Date(FIXTURE_NOW.getTime() + hours * MS_PER_HOUR).toISOString()
}

export function plannedDate(value: string): SourcedDate {
  return { value, provenance: 'estimated', source: 'booking', observedAt: hoursFromNow(-200) }
}

export function confirmedDate(value: string, source: string): SourcedDate {
  return { value, provenance: 'confirmed', source, observedAt: value }
}

function leg(
  id: string,
  sequence: number,
  mode: Leg['mode'],
  operator: [string, string],
  from: string,
  to: string,
): Leg {
  const [operatorId, operatorName] = operator
  return {
    id,
    sequence,
    mode,
    operatorId,
    operatorName,
    from,
    to,
    plannedDeparture: hoursFromNow(-24 + sequence * 48),
    plannedArrival: hoursFromNow(sequence * 48),
    trackingNumber: `${operatorId.toUpperCase()}-${id}`,
    vessel: mode === 'sea' ? 'BW Aurora' : null,
  }
}

const ROAD_LEGS = [leg('leg_r1', 1, 'road', ['op_tir', 'TransIbérica'], 'Zaragoza Plant', 'Madrid')]
const MULTIMODAL_LEGS = [
  leg('leg_m1', 1, 'road', ['op_pld', 'PortLink'], 'Valencia Warehouse', 'Valencia port'),
  leg('leg_m2', 2, 'sea', ['op_bws', 'BlueWave'], 'Valencia port', 'Veracruz'),
  leg('leg_m3', 3, 'road', ['op_lmx', 'LastMile MX'], 'Veracruz', 'Querétaro'),
]

type PlanEntry = [string | null, MilestoneType]

// BR-MS-01/02.
const ROAD_PLAN: PlanEntry[] = [
  ['leg_r1', 'picked_up'],
  ['leg_r1', 'departed_site'],
  ['leg_r1', 'out_for_delivery'],
  ['leg_r1', 'delivered'],
]
const MULTIMODAL_PLAN: PlanEntry[] = [
  ['leg_m1', 'picked_up'],
  ['leg_m1', 'departed_site'],
  ['leg_m1', 'arrived_port'],
  ['leg_m2', 'loaded_on_vessel'],
  ['leg_m2', 'vessel_departed'],
  ['leg_m2', 'vessel_arrived'],
  ['leg_m2', 'discharged'],
  [null, 'customs_submitted'],
  [null, 'customs_cleared'],
  ['leg_m3', 'picked_up'],
  ['leg_m3', 'out_for_delivery'],
  ['leg_m3', 'delivered'],
]

interface Progress {
  done: number
  notReported?: MilestoneType[]
  overdue?: MilestoneType[]
  holds?: CustomsHold[]
}

function timeline(legs: Leg[], plan: PlanEntry[], progress: Progress): Timeline {
  const milestones = plan.map(([legId, type], index) => {
    const id = `ms_${index}`
    const planned = plannedDate(hoursFromNow(index * 6 - 40))
    if (index >= progress.done) {
      const state = progress.overdue?.includes(type) ? ('overdue' as const) : ('pending' as const)
      return { id, legId, type, state, planned }
    }
    if (progress.notReported?.includes(type)) {
      return { id, legId, type, state: 'not_reported' as const, planned }
    }
    const source = legs.find((candidate) => candidate.id === legId)?.operatorId ?? 'op_bws'
    const actual = confirmedDate(hoursFromNow(index * 6 - 39), source)
    return { id, legId, type, state: 'done' as const, planned, actual, rawEventId: `raw_${index}` }
  })
  return { shipmentId: 'shp_test', milestones, customsHolds: progress.holds ?? [] }
}

function shipment(
  legs: Leg[],
  status: ShipmentStatus,
  last: PlanEntry | null,
  extra: Partial<Shipment> = {},
): Shipment {
  return {
    id: 'shp_test',
    reference: 'SH-TEST',
    accountId: 'acc_test',
    accountName: 'Test account',
    originSiteId: 'site_test',
    originSiteName: legs[0]?.from ?? '',
    destination: { city: legs.at(-1)?.to ?? '', country: 'MX', international: true },
    legs,
    currentLegId: legs[0]?.id ?? '',
    status,
    eta: { ...plannedDate(hoursFromNow(30)), outdated: false, rawEventId: null, basis: null },
    plannedEta: hoursFromNow(30),
    onTime: 'on_time',
    lastEventAt: last ? hoursFromNow(-2) : null,
    stale: false,
    hasCustoms: legs.some((candidate) => candidate.mode === 'sea'),
    lastDoneMilestone: last && { legId: last[0], type: last[1] },
    ...extra,
  }
}

export const OPEN_HOLD: CustomsHold = {
  id: 'hold_raw_hold',
  reportedAt: confirmedDate(hoursFromNow(-5), 'op_bws'),
  open: true,
  rawEventId: 'raw_hold',
}

// 07 §4: road only, booked, multimodal with customs, on hold, delivered.
export const ROUTES = {
  roadInTransit: {
    shipment: shipment(ROAD_LEGS, 'in_transit', ['leg_r1', 'departed_site']),
    timeline: timeline(ROAD_LEGS, ROAD_PLAN, { done: 2, overdue: ['out_for_delivery'] }),
  },
  roadBooked: {
    shipment: shipment(ROAD_LEGS, 'booked', null),
    timeline: timeline(ROAD_LEGS, ROAD_PLAN, { done: 0 }),
  },
  multimodalAtSea: {
    shipment: shipment(MULTIMODAL_LEGS, 'in_transit', ['leg_m2', 'vessel_departed'], {
      currentLegId: 'leg_m2',
    }),
    timeline: timeline(MULTIMODAL_LEGS, MULTIMODAL_PLAN, {
      done: 5,
      notReported: ['loaded_on_vessel'],
    }),
  },
  multimodalOnHold: {
    shipment: shipment(MULTIMODAL_LEGS, 'on_hold', [null, 'customs_submitted'], {
      currentLegId: 'leg_m2',
    }),
    timeline: timeline(MULTIMODAL_LEGS, MULTIMODAL_PLAN, { done: 8, holds: [OPEN_HOLD] }),
  },
  multimodalDelivered: {
    shipment: shipment(MULTIMODAL_LEGS, 'delivered', ['leg_m3', 'delivered'], {
      currentLegId: 'leg_m3',
    }),
    timeline: timeline(MULTIMODAL_LEGS, MULTIMODAL_PLAN, { done: 12 }),
  },
}
