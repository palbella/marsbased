import {
  onTimeIndicatorSchema,
  shipmentStatusSchema,
  shipmentViewSchema,
  type OnTimeIndicator,
  type ShipmentFilters,
  type ShipmentStatus,
  type ShipmentView,
} from '@/domain'

// CP-04: the view switch covers `delivered`, so the status filter offers the rest.
export const activeStatusSchema = shipmentStatusSchema.exclude(['delivered'])
export const statusOptions = activeStatusSchema.options

export interface ArrivalFilters {
  view: ShipmentView
  q?: string
  status?: Exclude<ShipmentStatus, 'delivered'>
  onTime?: OnTimeIndicator
}

// CP-01, CP-04: `?q=&status=&onTime=&view=`. Unknown values are ignored, never an error.
export function parseArrivalFilters(params: URLSearchParams): ArrivalFilters {
  const q = params.get('q')?.trim()
  return {
    view: shipmentViewSchema.safeParse(params.get('view')).data ?? 'active',
    q: q ? q : undefined,
    status: activeStatusSchema.safeParse(params.get('status')).data,
    onTime: onTimeIndicatorSchema.safeParse(params.get('onTime')).data,
  }
}

// The default view stays out of the URL, so `/portal` is the plain active agenda.
export function toSearchParams(filters: ArrivalFilters): URLSearchParams {
  const entries = Object.entries({
    ...filters,
    view: filters.view === 'active' ? undefined : filters.view,
  })
  const params = new URLSearchParams()
  for (const [key, value] of entries) {
    if (value) params.set(key, value)
  }
  return params
}

export function toShipmentFilters(filters: ArrivalFilters): ShipmentFilters {
  return { view: filters.view, q: filters.q, status: filters.status, onTime: filters.onTime }
}

export function hasNarrowingFilters(filters: ArrivalFilters): boolean {
  return Boolean(filters.q || filters.status || filters.onTime)
}
