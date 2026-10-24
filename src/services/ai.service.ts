import {
  draftMessageInsightSchema,
  etaPredictionInsightSchema,
  mappingSuggestionInsightSchema,
  priorityInsightSchema,
  shipmentSummaryInsightSchema,
} from '@/domain'
import { apiGet, apiGetOptional, apiPost, type RequestOptions } from './api-client'

const segment = encodeURIComponent

// AI-1..5.
export const aiService = {
  getSummary: (shipmentId: string, options?: RequestOptions) =>
    apiGet(`/ai/shipments/${segment(shipmentId)}/summary`, shipmentSummaryInsightSchema, options),
  // null when there is nothing left to predict, e.g. delivered (BR-ETA-06).
  getEtaPrediction: (shipmentId: string, options?: RequestOptions) =>
    apiGetOptional(
      `/ai/shipments/${segment(shipmentId)}/eta-prediction`,
      etaPredictionInsightSchema,
      options,
    ),
  getPriority: (exceptionId: string, options?: RequestOptions) =>
    apiGet(`/ai/exceptions/${segment(exceptionId)}/priority`, priorityInsightSchema, options),
  draftMessage: (exceptionId: string) =>
    apiPost(
      `/ai/exceptions/${segment(exceptionId)}/draft-message`,
      undefined,
      draftMessageInsightSchema,
    ),
  getMappingSuggestion: (rawEventId: string, options?: RequestOptions) =>
    apiGet(
      `/ai/raw-events/${segment(rawEventId)}/mapping-suggestion`,
      mappingSuggestionInsightSchema,
      options,
    ),
}
