import type { ShipmentFilters } from '@/domain'
import { hoursBetween } from '@/mocks/engine/time'
import type { LoadedShipment } from './shipment-loader'

// CP-04: the *Delivered* view shows deliveries of the last 7 days.
const DELIVERED_VIEW_HOURS = 7 * 24

// GET /api/shipments filters (02 §5.2, CP-04, OP-21). An omitted filter matches everything.
export function matchesShipmentFilters(
  { facts, view }: LoadedShipment,
  filters: ShipmentFilters,
  now: Date,
): boolean {
  const { legs, shipment } = facts
  const checks = [
    filters.view === undefined || matchesView({ facts, view }, filters.view, now),
    filters.status === undefined || view.status === filters.status,
    filters.onTime === undefined || view.onTime === filters.onTime,
    filters.site === undefined || shipment.originSiteId === filters.site,
    // A shipment travels with every operator and mode of its legs.
    filters.operator === undefined || legs.some((leg) => leg.operatorId === filters.operator),
    filters.mode === undefined || legs.some((leg) => leg.mode === filters.mode),
    filters.scope === undefined || (filters.scope === 'international') === view.international,
    filters.q === undefined || shipment.reference.toLowerCase().includes(filters.q.toLowerCase()),
  ]
  return checks.every(Boolean)
}

function matchesView({ view }: LoadedShipment, kind: 'active' | 'delivered', now: Date): boolean {
  if (kind === 'active') return !view.delivered
  // BR-ETA-01: once delivered, the ETA is the actual delivery date.
  return view.delivered && hoursBetween(view.eta.value, now) <= DELIVERED_VIEW_HOURS
}
