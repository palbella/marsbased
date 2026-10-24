import { z } from 'zod'
import { idSchema, isoDateTimeSchema, modeSchema } from './primitives'

export const exceptionTypeSchema = z.enum([
  'delay',
  'hold',
  'stale',
  'customs_incident',
  'missing_document',
])
export type ExceptionType = z.infer<typeof exceptionTypeSchema>

// BR-EX-01..05 raise `medium` or `high`; `low` exists in the severity factor of BR-PR-01.
export const severitySchema = z.enum(['low', 'medium', 'high'])
export type Severity = z.infer<typeof severitySchema>

// BR-EX-09.
export const exceptionStatusSchema = z.enum(['open', 'acknowledged', 'resolved'])
export type ExceptionStatus = z.infer<typeof exceptionStatusSchema>

// BR-AC-02.
export const waitingOnSchema = z.enum(['operator'])
export type WaitingOn = z.infer<typeof waitingOnSchema>

// BR-NA-01.
export const nextActionTypeSchema = z.enum([
  'notify_customer',
  'contact_operator',
  'upload_document',
])
export type NextActionType = z.infer<typeof nextActionTypeSchema>

// BR-PR-01.
export const MAX_PRIORITY_SCORE = 100

export const exceptionSchema = z.object({
  id: idSchema,
  shipmentId: idSchema,
  shipmentReference: z.string().min(1),
  accountName: z.string().min(1),
  // Operator and mode of the current leg (OP-02).
  operatorId: idSchema,
  operatorName: z.string().min(1),
  mode: modeSchema,
  type: exceptionTypeSchema,
  severity: severitySchema,
  status: exceptionStatusSchema,
  waitingOn: waitingOnSchema.nullable(),
  assigneeId: idSchema.nullable(),
  // One-line reason it was raised (US-O-01, OP-02).
  reason: z.string().min(1),
  // Ordered; the first one is the primary action (BR-NA-01).
  nextActions: z.array(nextActionTypeSchema),
  priorityScore: z.number().int().min(0).max(MAX_PRIORITY_SCORE),
  // Factor labels for the queue row, e.g. "Key account" (BR-PR-03, OP-03).
  priorityFactors: z.array(z.string().min(1)),
  detectedAt: isoDateTimeSchema,
  resolvedAt: isoDateTimeSchema.nullable(),
  resolutionNote: z.string().min(1).nullable(),
})
export type Exception = z.infer<typeof exceptionSchema>

export const exceptionListSchema = z.array(exceptionSchema)
