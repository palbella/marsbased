'use client'

import { useQuery } from '@tanstack/react-query'
import type { PredictionFact } from '@/domain'
import { aiService, queryKeys } from '@/services'

// CP-10, AI-1: loads next to the shipment, never before it; a failure hides the note (SC-06).
export function useShipmentSummary(shipmentId: string) {
  return useQuery({
    queryKey: queryKeys.ai.summary(shipmentId),
    queryFn: ({ signal }) => aiService.getSummary(shipmentId, { signal }),
  })
}

// AI-5: `null` when the API answers 204, nothing left to predict (BR-ETA-06). List rows
// enable it only where the prediction explains the row (CP-03).
export function useEtaPrediction(shipmentId: string, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.ai.etaPrediction(shipmentId),
    queryFn: ({ signal }) => aiService.getEtaPrediction(shipmentId, { signal }),
    enabled,
  })
}

// SC-02, CP-03: the prediction as the fact the on-time rules read (BR-OT-01); null while
// loading, after a 204 or on failure.
export function usePredictionFact(
  shipmentId: string,
  options: { enabled?: boolean } = {},
): PredictionFact | null {
  const { data } = useEtaPrediction(shipmentId, options)
  if (!data) return null
  return { value: data.content.predictedEta.value, confidence: data.confidence }
}
