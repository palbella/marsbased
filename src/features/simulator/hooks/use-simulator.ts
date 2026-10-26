'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FailureMode, ScenarioId } from '@/domain'
import { IS_NON_PRODUCTION } from '@/lib/environment'
import { queryKeys, simulatorService } from '@/services'

// OP-50, OP-51. The mutations never retry (02 §5.6); what they change reaches every tab,
// this one included, as realtime events (BR-RT-01), which refetch the affected views.
export function useScenarios() {
  return useQuery({
    queryKey: queryKeys.simulator.scenarios(),
    queryFn: ({ signal }) => simulatorService.listScenarios({ signal }),
  })
}

export function useRunScenario() {
  return useMutation({ mutationFn: (id: ScenarioId) => simulatorService.runScenario(id) })
}

// OP-52.
export function useAdvanceClock() {
  return useMutation({ mutationFn: (hours: number) => simulatorService.advanceClock(hours) })
}

// OP-53.
export function useResetData() {
  return useMutation({ mutationFn: () => simulatorService.reset() })
}

// OP-55: the failure mode of this tab; its endpoint is exempt from it (02 §5.6).
export function useNetworkConditions() {
  return useQuery({
    queryKey: queryKeys.simulator.network(),
    queryFn: ({ signal }) => simulatorService.getNetwork({ signal }),
    enabled: IS_NON_PRODUCTION,
  })
}

export function useSetNetwork() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (mode: FailureMode) => simulatorService.setNetwork(mode),
    onSuccess: (conditions) => queryClient.setQueryData(queryKeys.simulator.network(), conditions),
  })
}
