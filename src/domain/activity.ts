import { z } from 'zod'
import {
  acknowledgePayloadSchema,
  contactOperatorPayloadSchema,
  notifyCustomerPayloadSchema,
  resolvePayloadSchema,
  uploadDocumentPayloadSchema,
} from './exception-action'
import { exceptionTypeSchema } from './exception'
import { idSchema, isoDateTimeSchema } from './primitives'

const activityBaseSchema = z.object({
  id: idSchema,
  shipmentId: idSchema,
  exceptionId: idSchema.nullable(),
  // null for entries made by the system (BR-EX-07).
  userId: idSchema.nullable(),
  userName: z.string().min(1).nullable(),
  at: isoDateTimeSchema,
})

const reasonPayloadSchema = z.object({
  exceptionType: exceptionTypeSchema,
  reason: z.string().min(1),
})

// Ops actions (BR-AC-*) plus the engine's own entries (BR-EX-07, OP-10 history).
export const activityEntrySchema = z.discriminatedUnion('type', [
  activityBaseSchema.extend({
    type: z.literal('notify_customer'),
    payload: notifyCustomerPayloadSchema,
  }),
  activityBaseSchema.extend({
    type: z.literal('contact_operator'),
    payload: contactOperatorPayloadSchema,
  }),
  activityBaseSchema.extend({
    type: z.literal('upload_document'),
    payload: uploadDocumentPayloadSchema,
  }),
  activityBaseSchema.extend({ type: z.literal('acknowledge'), payload: acknowledgePayloadSchema }),
  activityBaseSchema.extend({ type: z.literal('resolve'), payload: resolvePayloadSchema }),
  activityBaseSchema.extend({ type: z.literal('exception_raised'), payload: reasonPayloadSchema }),
  activityBaseSchema.extend({
    type: z.literal('exception_auto_resolved'),
    payload: reasonPayloadSchema,
  }),
])
export type ActivityEntry = z.infer<typeof activityEntrySchema>
export type ActivityType = ActivityEntry['type']

export const activityListSchema = z.array(activityEntrySchema)
