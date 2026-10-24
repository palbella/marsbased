import { z } from 'zod'
import { idSchema, isoDateTimeSchema } from './primitives'
import { sourcedDateSchema } from './provenance'

// BR-AL-01.
export const alertTypeSchema = z.enum([
  'at_risk',
  'late',
  'eta_changed',
  'on_hold',
  'customs_issue',
  'delivered',
  'message',
])
export type AlertType = z.infer<typeof alertTypeSchema>

// BR-AL-03: old → new ETA, each with its provenance. null = unknown.
export const etaImpactSchema = z.object({
  previousEta: sourcedDateSchema.nullable(),
  newEta: sourcedDateSchema.nullable(),
})
export type EtaImpact = z.infer<typeof etaImpactSchema>

export const alertSchema = z.object({
  id: idSchema,
  shipmentId: idSchema,
  shipmentReference: z.string().min(1),
  type: alertTypeSchema,
  title: z.string().min(1),
  message: z.string().min(1),
  etaImpact: etaImpactSchema.nullable(),
  requiresAction: z.boolean(),
  createdAt: isoDateTimeSchema,
  readAt: isoDateTimeSchema.nullable(),
})
export type Alert = z.infer<typeof alertSchema>

export const alertListSchema = z.array(alertSchema)
