import { z } from 'zod'
import { isoDateTimeSchema } from './primitives'

// P1: every time-sensitive value says where it comes from.
export const provenanceSchema = z.enum(['confirmed', 'estimated', 'predicted'])
export type Provenance = z.infer<typeof provenanceSchema>

const sourceMetaSchema = z.object({
  provenance: provenanceSchema,
  // An operator id, 'booking' (BR-MS-03), 'system' (BR-ETA-03/04) or 'ai' (BR-ETA-06).
  source: z.string().min(1),
  observedAt: isoDateTimeSchema,
})

export function sourced<T extends z.ZodType>(valueSchema: T) {
  return sourceMetaSchema.extend({ value: valueSchema })
}

export type Sourced<T> = z.infer<typeof sourceMetaSchema> & { value: T }

export const sourcedDateSchema = sourced(isoDateTimeSchema)
export type SourcedDate = z.infer<typeof sourcedDateSchema>
