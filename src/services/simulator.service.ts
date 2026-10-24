import { networkConditionsSchema, type FailureMode } from '@/domain'
import { apiGet, apiPost, type RequestOptions } from './api-client'

// US-R-02, non-production only. Scenarios, clock and reset arrive with T11.
export const simulatorService = {
  // OP-55: the failure mode of the current tab (02 §5.6).
  getNetwork: (options?: RequestOptions) =>
    apiGet('/simulator/network', networkConditionsSchema, options),
  setNetwork: (mode: FailureMode) =>
    apiPost('/simulator/network', { mode }, networkConditionsSchema),
}
