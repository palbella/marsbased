import { z } from 'zod'

// 02 §5.6: one code per status the API answers with.
export const apiErrorCodeSchema = z.enum([
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'validation_failed',
  'unavailable',
])
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>

export const apiErrorBodySchema = z.object({
  code: apiErrorCodeSchema,
  message: z.string().min(1),
})
export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>
