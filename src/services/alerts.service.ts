import { alertListSchema, alertSchema, type AlertFilters } from '@/domain'
import { apiGet, apiPost, apiPostEmpty, type RequestOptions } from './api-client'
import { toQueryString } from './query-string'

// US-C-04.
export const alertsService = {
  list: (filters: AlertFilters = {}, options?: RequestOptions) =>
    apiGet(`/alerts${toQueryString(filters)}`, alertListSchema, options),
  markRead: (id: string) =>
    apiPost(`/alerts/${encodeURIComponent(id)}/read`, undefined, alertSchema),
  // CP-22.
  markAllRead: () => apiPostEmpty('/alerts/read-all'),
}
