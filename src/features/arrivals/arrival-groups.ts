import type { OnTimeIndicator, Shipment } from '@/domain'
import { addDays, startOfDay } from '@/lib/calendar'

export type ArrivalGroupId =
  'attention' | 'today' | 'tomorrow' | 'next_7_days' | 'later' | 'delivered'

export interface ArrivalGroup {
  id: ArrivalGroupId
  title: string
  shipments: Shipment[]
}

const groupTitles: Record<ArrivalGroupId, string> = {
  attention: 'Needs attention',
  today: 'Today',
  tomorrow: 'Tomorrow',
  next_7_days: 'Next 7 days',
  later: 'Later',
  delivered: 'Delivered (last 7 days)',
}

const GROUP_ORDER: ArrivalGroupId[] = ['attention', 'today', 'tomorrow', 'next_7_days', 'later']

// CP-02: *Next 7 days* runs to the end of the 7th day after today (a rolling window).
const NEXT_DAYS_WINDOW = 7

// CP-02, BR-OT-03: the on-time values and the status that pin a shipment on top.
const ATTENTION_ON_TIME: readonly OnTimeIndicator[] = ['late', 'at_risk', 'unknown']

export function needsAttention(shipment: Pick<Shipment, 'onTime' | 'status'>): boolean {
  return ATTENTION_ON_TIME.includes(shipment.onTime) || shipment.status === 'on_hold'
}

// CP-02, DS-09: the arrivals agenda. Within a group the API order (BR-OT-03) is kept; empty
// groups are left out. Days are local to the viewer, by the simulation clock (BR-TM-01).
export function groupArrivals(shipments: Shipment[], now: Date): ArrivalGroup[] {
  const byGroup = new Map<ArrivalGroupId, Shipment[]>()
  for (const shipment of shipments) {
    const id = arrivalGroupOf(shipment, now)
    byGroup.set(id, [...(byGroup.get(id) ?? []), shipment])
  }
  return GROUP_ORDER.flatMap((id) => {
    const members = byGroup.get(id)
    return members ? [{ id, title: groupTitles[id], shipments: members }] : []
  })
}

function arrivalGroupOf(shipment: Shipment, now: Date): ArrivalGroupId {
  if (needsAttention(shipment)) return 'attention'
  if (shipment.eta === null) return 'later'
  const eta = Date.parse(shipment.eta.value)
  const tomorrow = addDays(startOfDay(now), 1)
  // An ETA already in the past still reads as today.
  if (eta < tomorrow.getTime()) return 'today'
  if (eta < addDays(tomorrow, 1).getTime()) return 'tomorrow'
  if (eta < addDays(tomorrow, NEXT_DAYS_WINDOW).getTime()) return 'next_7_days'
  return 'later'
}

// CP-02: the *Delivered* view is one flat group, newest delivery first (BR-ETA-01: the ETA of
// a delivered shipment is its delivery date).
export function deliveredArrivals(shipments: Shipment[]): ArrivalGroup {
  const newestFirst = [...shipments].sort((a, b) => deliveredAt(b) - deliveredAt(a))
  return { id: 'delivered', title: groupTitles.delivered, shipments: newestFirst }
}

function deliveredAt(shipment: Shipment): number {
  return shipment.eta ? Date.parse(shipment.eta.value) : 0
}
