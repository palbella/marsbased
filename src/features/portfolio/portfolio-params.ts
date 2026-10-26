import { z } from 'zod'
import { shipmentFiltersSchema, type ShipmentFilters } from '@/domain'

// OP-21: the portfolio lists both views, so `view` is not a filter here.
export type PortfolioFilters = Omit<ShipmentFilters, 'view'>

const FILTER_KEYS = ['q', 'site', 'operator', 'mode', 'scope', 'status', 'onTime'] as const

// OP-22: sortable columns; no `sort` keeps the API order (attention first, delivered last).
export const sortKeySchema = z.enum(['eta', 'status', 'onTime'])
export type SortKey = z.infer<typeof sortKeySchema>
export type SortDirection = 'asc' | 'desc'
export interface PortfolioSort {
  key: SortKey
  direction: SortDirection
}

export interface PortfolioParams {
  filters: PortfolioFilters
  sort: PortfolioSort | null
}

const SORT_PARAM = 'sort'
// Only the reversed order is written, so `?sort=eta` reads as the natural order.
const ORDER_PARAM = 'order'
const REVERSED = 'desc'

// 02 §8, OP-21: unknown or invalid values are dropped one by one, so a stale link still opens.
export function parsePortfolioParams(params: URLSearchParams): PortfolioParams {
  const filters: PortfolioFilters = {}
  for (const key of FILTER_KEYS) {
    const parsed = shipmentFiltersSchema.shape[key].safeParse(params.get(key) ?? undefined)
    if (parsed.success && parsed.data !== undefined) Object.assign(filters, { [key]: parsed.data })
  }
  const key = sortKeySchema.safeParse(params.get(SORT_PARAM)).data
  const direction = params.get(ORDER_PARAM) === REVERSED ? 'desc' : 'asc'
  return { filters, sort: key ? { key, direction } : null }
}

export function toPortfolioSearchParams({ filters, sort }: PortfolioParams): URLSearchParams {
  const params = new URLSearchParams()
  for (const key of FILTER_KEYS) {
    const value = filters[key]
    if (value !== undefined) params.set(key, value)
  }
  if (sort) params.set(SORT_PARAM, sort.key)
  if (sort?.direction === 'desc') params.set(ORDER_PARAM, REVERSED)
  return params
}

// OP-22: a click on another column sorts by it; a second click on the same one reverses it.
export function nextSort(current: PortfolioSort | null, key: SortKey): PortfolioSort {
  if (current?.key !== key) return { key, direction: 'asc' }
  return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
}

export function hasPortfolioFilters(filters: PortfolioFilters): boolean {
  return FILTER_KEYS.some((key) => filters[key] !== undefined)
}
