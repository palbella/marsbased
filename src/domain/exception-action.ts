import { z } from 'zod'
import { documentMetadataSchema } from './document'
import { nextActionTypeSchema } from './exception'
import { idSchema, nonEmptyTextSchema } from './primitives'

// BR-AC-01. `requiresAction` is the "Customer action required" tick of OP-11 (BR-AL-03).
export const notifyCustomerPayloadSchema = z.object({
  subject: nonEmptyTextSchema,
  message: nonEmptyTextSchema,
  requiresAction: z.boolean(),
})
export type NotifyCustomerPayload = z.infer<typeof notifyCustomerPayloadSchema>

// BR-AC-02.
export const contactOperatorPayloadSchema = z.object({
  operatorId: idSchema,
  message: nonEmptyTextSchema,
})
export type ContactOperatorPayload = z.infer<typeof contactOperatorPayloadSchema>

// BR-AC-03.
export const uploadDocumentPayloadSchema = documentMetadataSchema
export type UploadDocumentPayload = z.infer<typeof uploadDocumentPayloadSchema>

// BR-AC-04.
export const acknowledgePayloadSchema = z.object({})
export type AcknowledgePayload = z.infer<typeof acknowledgePayloadSchema>

// BR-AC-05: a note is required.
export const resolvePayloadSchema = z.object({ note: nonEmptyTextSchema })
export type ResolvePayload = z.infer<typeof resolvePayloadSchema>

// POST /api/exceptions/:id/actions. An invalid body answers 422 (BR-AC-06).
export const exceptionActionRequestSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('notify_customer'), payload: notifyCustomerPayloadSchema }),
  z.object({ type: z.literal('contact_operator'), payload: contactOperatorPayloadSchema }),
  z.object({ type: z.literal('upload_document'), payload: uploadDocumentPayloadSchema }),
  z.object({ type: z.literal('acknowledge'), payload: acknowledgePayloadSchema }),
  z.object({ type: z.literal('resolve'), payload: resolvePayloadSchema }),
])
export type ExceptionActionRequest = z.infer<typeof exceptionActionRequestSchema>

// BR-NA-02: acknowledge and resolve are always available besides the suggestions.
export const exceptionActionTypeSchema = z.enum([
  ...nextActionTypeSchema.options,
  'acknowledge',
  'resolve',
])
export type ExceptionActionType = z.infer<typeof exceptionActionTypeSchema>
