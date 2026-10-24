import {
  activityListSchema,
  rawEventListSchema,
  shipmentListSchema,
  shipmentSchema,
  timelineSchema,
  type ShipmentFilters,
} from '@/domain'
import { apiGet, type RequestOptions } from './api-client'
import { toQueryString } from './query-string'

// US-C-01/02, US-O-02/04.
export const shipmentsService = {
  list: (filters: ShipmentFilters = {}, options?: RequestOptions) =>
    apiGet(`/shipments${toQueryString(filters)}`, shipmentListSchema, options),
  getById: (id: string, options?: RequestOptions) =>
    apiGet(`/shipments/${encodeURIComponent(id)}`, shipmentSchema, options),
  getTimeline: (id: string, options?: RequestOptions) =>
    apiGet(`/shipments/${encodeURIComponent(id)}/timeline`, timelineSchema, options),
  getRawEvents: (id: string, options?: RequestOptions) =>
    apiGet(`/shipments/${encodeURIComponent(id)}/raw-events`, rawEventListSchema, options),
  getActivity: (id: string, options?: RequestOptions) =>
    apiGet(`/shipments/${encodeURIComponent(id)}/activity`, activityListSchema, options),
}
