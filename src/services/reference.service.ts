import { referenceDataSchema } from '@/domain'
import { apiGet, type RequestOptions } from './api-client'

// US-O-01/02: filter options within the perimeter.
export const referenceService = {
  get: (options?: RequestOptions) => apiGet('/reference', referenceDataSchema, options),
}
