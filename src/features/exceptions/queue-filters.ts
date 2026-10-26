import { exceptionFiltersSchema, type ExceptionFilters } from '@/domain'

// OP-04: the queue filters the URL can carry. `shipmentId` belongs to the shipment detail.
export type QueueFilters = Omit<ExceptionFilters, 'shipmentId'>

const queueFiltersSchema = exceptionFiltersSchema.omit({ shipmentId: true })
const FILTER_KEYS = ['site', 'operator', 'mode', 'type', 'status'] as const

// OP-10: the open exception panel, so it can be shared and survives a reload.
export const EXCEPTION_PARAM = 'exception'

// Unknown or invalid values are dropped one by one, so a stale link still opens the queue.
export function parseQueueFilters(params: URLSearchParams): QueueFilters {
  const filters: QueueFilters = {}
  for (const key of FILTER_KEYS) {
    const value = params.get(key)
    if (value === null) continue
    const parsed = queueFiltersSchema.shape[key].safeParse(value)
    if (parsed.success && parsed.data !== undefined) Object.assign(filters, { [key]: parsed.data })
  }
  return filters
}

// `exception` is kept as it is: changing a filter does not close the panel.
export function toQueueSearchParams(
  filters: QueueFilters,
  exceptionId: string | null,
): URLSearchParams {
  const params = new URLSearchParams()
  for (const key of FILTER_KEYS) {
    const value = filters[key]
    if (value !== undefined) params.set(key, value)
  }
  if (exceptionId !== null) params.set(EXCEPTION_PARAM, exceptionId)
  return params
}

export function hasQueueFilters(filters: QueueFilters): boolean {
  return FILTER_KEYS.some((key) => filters[key] !== undefined)
}
