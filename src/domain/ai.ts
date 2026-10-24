import { z } from 'zod'
import { notifyCustomerPayloadSchema } from './exception-action'
import { MAX_PRIORITY_SCORE } from './exception'
import { mappingTargetSchema } from './mapping'
import { isoDateTimeSchema } from './primitives'
import { sourced } from './provenance'

export const aiInsightKindSchema = z.enum([
  'summary',
  'eta_prediction',
  'priority',
  'draft',
  'mapping',
])
export type AiInsightKind = z.infer<typeof aiInsightKindSchema>

// 02 §6.3, P3: every AI output shows its confidence and the evidence behind it.
const aiInsightMetaSchema = z.object({
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string().min(1)),
  generatedAt: isoDateTimeSchema,
  model: z.string().min(1),
})

export function aiInsight<K extends AiInsightKind, T extends z.ZodType>(kind: K, content: T) {
  return aiInsightMetaSchema.extend({ kind: z.literal(kind), content })
}

export type AiInsight<T> = z.infer<typeof aiInsightMetaSchema> & {
  kind: AiInsightKind
  content: T
}

// AI-1, BR-AI-01.
export const shipmentSummaryInsightSchema = aiInsight(
  'summary',
  z.object({ text: z.string().min(1) }),
)
export type ShipmentSummaryInsight = z.infer<typeof shipmentSummaryInsightSchema>

// AI-5, BR-AI-05, BR-ETA-06: returned separately, never replaces the ETA.
export const predictedEtaSchema = sourced(isoDateTimeSchema).extend({
  provenance: z.literal('predicted'),
})
export const etaPredictionInsightSchema = aiInsight(
  'eta_prediction',
  z.object({ predictedEta: predictedEtaSchema }),
)
export type EtaPredictionInsight = z.infer<typeof etaPredictionInsightSchema>

// AI-2, BR-AI-02, BR-PR-01..03: factor values behind the score.
export const priorityInsightSchema = aiInsight(
  'priority',
  z.object({
    score: z.number().int().min(0).max(MAX_PRIORITY_SCORE),
    rationale: z.string().min(1),
    factors: z.object({
      severity: z.number().positive(),
      impact: z.number().positive(),
      urgency: z.number().positive(),
      age: z.number().positive(),
    }),
  }),
)
export type PriorityInsight = z.infer<typeof priorityInsightSchema>

// AI-3, BR-AI-03: same fields as the notify_customer action, so the agent edits and sends it.
export const draftMessageInsightSchema = aiInsight('draft', notifyCustomerPayloadSchema)
export type DraftMessageInsight = z.infer<typeof draftMessageInsightSchema>

// AI-4, BR-AI-04: top candidates with their similarity score.
export const MAPPING_SUGGESTION_LIMIT = 3
export const mappingSuggestionInsightSchema = aiInsight(
  'mapping',
  z.object({
    candidates: z
      .array(z.object({ target: mappingTargetSchema, score: z.number().min(0).max(1) }))
      .max(MAPPING_SUGGESTION_LIMIT),
  }),
)
export type MappingSuggestionInsight = z.infer<typeof mappingSuggestionInsightSchema>
