import { z } from 'zod'
import { userSchema } from './org'

export const signInRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})
export type SignInRequest = z.infer<typeof signInRequestSchema>

export const signInResponseSchema = z.object({
  token: z.string().min(1),
  user: userSchema,
})
export type SignInResponse = z.infer<typeof signInResponseSchema>
