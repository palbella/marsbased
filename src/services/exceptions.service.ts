import {
  exceptionListSchema,
  exceptionSchema,
  type ExceptionActionRequest,
  type ExceptionFilters,
} from '@/domain'
import { apiGet, apiPost, type RequestOptions } from './api-client'
import { toQueryString } from './query-string'

// US-O-01/03.
export const exceptionsService = {
  list: (filters: ExceptionFilters = {}, options?: RequestOptions) =>
    apiGet(`/exceptions${toQueryString(filters)}`, exceptionListSchema, options),
  getById: (id: string, options?: RequestOptions) =>
    apiGet(`/exceptions/${encodeURIComponent(id)}`, exceptionSchema, options),
  // 04 §10: every action goes through one audited endpoint.
  runAction: (id: string, action: ExceptionActionRequest) =>
    apiPost(`/exceptions/${encodeURIComponent(id)}/actions`, action, exceptionSchema),
}
