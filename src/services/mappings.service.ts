import { statusMappingSchema, unmappedStatusListSchema, type ConfirmMappingRequest } from '@/domain'
import { apiGet, apiPost, type RequestOptions } from './api-client'

// US-O-05.
export const mappingsService = {
  listUnmapped: (options?: RequestOptions) =>
    apiGet('/mappings/unmapped', unmappedStatusListSchema, options),
  // BR-NM-03: reprocesses every past event with that code.
  confirm: (mapping: ConfirmMappingRequest) => apiPost('/mappings', mapping, statusMappingSchema),
}
