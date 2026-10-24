import { z } from 'zod'
import { idSchema, isoDateTimeSchema } from './primitives'
import { milestoneTypeSchema } from './timeline'

// BR-NM-01.
export const mappingTargetSchema = z.enum([
  ...milestoneTypeSchema.options,
  'eta_update',
  'position_update',
  'ignore',
])
export type MappingTarget = z.infer<typeof mappingTargetSchema>

export const statusMappingSchema = z.object({
  id: idSchema,
  operatorId: idSchema,
  rawCode: z.string().min(1),
  target: mappingTargetSchema,
})
export type StatusMapping = z.infer<typeof statusMappingSchema>

// GET /api/mappings/unmapped: one row per unmapped (operator, code) pair (OP-40).
export const unmappedStatusSchema = z.object({
  operatorId: idSchema,
  operatorName: z.string().min(1),
  rawCode: z.string().min(1),
  occurrences: z.number().int().positive(),
  lastSeenAt: isoDateTimeSchema,
  // Latest occurrence, used to request the AI suggestion (BR-AI-04).
  latestRawEventId: idSchema,
  // Limited to the user's perimeter (BR-PM-05).
  affectedShipments: z.array(z.object({ id: idSchema, reference: z.string().min(1) })),
})
export type UnmappedStatus = z.infer<typeof unmappedStatusSchema>

export const unmappedStatusListSchema = z.array(unmappedStatusSchema)

// POST /api/mappings: confirms a mapping and reprocesses past events (BR-NM-03).
export const confirmMappingRequestSchema = statusMappingSchema.omit({ id: true })
export type ConfirmMappingRequest = z.infer<typeof confirmMappingRequestSchema>
