// SC-06, DS-06: confidence is shown as a word: low under 0.6, medium under 0.8, high.
export const MEDIUM_CONFIDENCE_FROM = 0.6
export const HIGH_CONFIDENCE_FROM = 0.8

export type ConfidenceLevel = 'low' | 'medium' | 'high'

export function confidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence < MEDIUM_CONFIDENCE_FROM) return 'low'
  if (confidence < HIGH_CONFIDENCE_FROM) return 'medium'
  return 'high'
}

// DS-05: the `AI 68%` tag and the "68% confidence" tooltip.
export function confidencePercent(confidence: number): number {
  return Math.round(confidence * 100)
}
