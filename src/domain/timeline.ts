import { z } from 'zod'
import { idSchema } from './primitives'
import { sourcedDateSchema } from './provenance'

// BR-MS-01, BR-MS-05.
export const milestoneTypeSchema = z.enum([
  'picked_up',
  'departed_site',
  'arrived_port',
  'loaded_on_vessel',
  'vessel_departed',
  'vessel_arrived',
  'discharged',
  'customs_submitted',
  'customs_cleared',
  'customs_hold',
  'out_for_delivery',
  'delivered',
])
export type MilestoneType = z.infer<typeof milestoneTypeSchema>

// BR-MS-04.
export const milestoneStateSchema = z.enum(['done', 'not_reported', 'overdue', 'pending'])
export type MilestoneState = z.infer<typeof milestoneStateSchema>

export const milestoneSchema = z.object({
  id: idSchema,
  // null for the customs block, which sits between legs (BR-MS-02).
  legId: idSchema.nullable(),
  type: milestoneTypeSchema,
  state: milestoneStateSchema,
  planned: sourcedDateSchema.optional(),
  actual: sourcedDateSchema.optional(),
  // BR-NM-05: traceability to the operator message.
  rawEventId: idSchema.optional(),
})
export type Milestone = z.infer<typeof milestoneSchema>

// BR-MS-05: a hold is open until a later `customs_cleared` arrives.
export const customsHoldSchema = z.object({
  id: idSchema,
  reportedAt: sourcedDateSchema,
  open: z.boolean(),
  rawEventId: idSchema,
})
export type CustomsHold = z.infer<typeof customsHoldSchema>

// GET /api/shipments/:id/timeline: customer-safe, no raw payloads (BR-PM-04).
export const timelineSchema = z.object({
  shipmentId: idSchema,
  // Plan order (BR-MS-01).
  milestones: z.array(milestoneSchema),
  customsHolds: z.array(customsHoldSchema),
})
export type Timeline = z.infer<typeof timelineSchema>
