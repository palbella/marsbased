import {
  networkConditionsSchema,
  scenarioListSchema,
  scenarioSchema,
  simulationClockSchema,
  testAccountsSchema,
  type FailureMode,
  type ScenarioId,
} from '@/domain'
import { apiGet, apiPost, apiPostEmpty, type RequestOptions } from './api-client'

// US-R-02, OP-50..55, non-production only.
export const simulatorService = {
  listScenarios: (options?: RequestOptions) =>
    apiGet('/simulator/scenarios', scenarioListSchema, options),
  runScenario: (id: ScenarioId) =>
    apiPost(`/simulator/scenarios/${encodeURIComponent(id)}/run`, undefined, scenarioSchema),
  // BR-TM-01: relative times in the UI read this clock, not the browser's.
  getClock: (options?: RequestOptions) =>
    apiGet('/simulator/clock', simulationClockSchema, options),
  advanceClock: (hours: number) => apiPost('/simulator/clock', { hours }, simulationClockSchema),
  // OP-53: sessions are kept.
  reset: () => apiPostEmpty('/simulator/reset'),
  // OP-55: the failure mode of the current tab (02 §5.6).
  getNetwork: (options?: RequestOptions) =>
    apiGet('/simulator/network', networkConditionsSchema, options),
  setNetwork: (mode: FailureMode) =>
    apiPost('/simulator/network', { mode }, networkConditionsSchema),
  // UI-07: answered without a session.
  getTestAccounts: (options?: RequestOptions) =>
    apiGet('/simulator/test-accounts', testAccountsSchema, options),
}
