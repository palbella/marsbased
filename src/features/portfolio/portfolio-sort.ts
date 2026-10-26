import { shipmentStatusSchema, type OnTimeIndicator, type Shipment } from '@/domain'
import type { PortfolioSort, SortKey } from './portfolio-params'

// OP-22: the most urgent indicator first.
const ON_TIME_ORDER: OnTimeIndicator[] = ['late', 'at_risk', 'unknown', 'on_time']
// OP-22: journey order, `booked` → `delivered`, as the status enum declares it (BR-ST-01).
const STATUS_ORDER = shipmentStatusSchema.options

type Compare = (a: Shipment, b: Shipment) => number

const compareBy: Record<SortKey, Compare> = {
  eta: compareEta,
  status: (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  onTime: (a, b) => ON_TIME_ORDER.indexOf(a.onTime) - ON_TIME_ORDER.indexOf(b.onTime),
}

// OP-22: sorts a copy; ties keep the API order (attention first, delivered last), and no
// sort returns that order untouched.
export function sortPortfolio(shipments: Shipment[], sort: PortfolioSort | null): Shipment[] {
  if (!sort) return shipments
  const compare = compareBy[sort.key]
  const sign = sort.direction === 'asc' ? 1 : -1
  return [...shipments].sort((a, b) => {
    // An unknown ETA stays last in both directions: there is nothing to order it by.
    if (sort.key === 'eta' && (a.eta === null || b.eta === null)) return compareEta(a, b)
    return sign * compare(a, b)
  })
}

function compareEta(a: Shipment, b: Shipment): number {
  if (a.eta === null || b.eta === null) return Number(a.eta === null) - Number(b.eta === null)
  return Date.parse(a.eta.value) - Date.parse(b.eta.value)
}
