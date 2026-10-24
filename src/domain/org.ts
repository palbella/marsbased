import { z } from 'zod'
import { idSchema, modeSchema } from './primitives'

export const roleSchema = z.enum(['customer', 'ops_agent', 'ops_manager'])
export type Role = z.infer<typeof roleSchema>

export const siteTypeSchema = z.enum(['factory', 'warehouse'])
export type SiteType = z.infer<typeof siteTypeSchema>

export const siteSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  type: siteTypeSchema,
  city: z.string().min(1),
  country: z.string().length(2),
})
export type Site = z.infer<typeof siteSchema>

export const accountTypeSchema = z.enum(['customer', 'subsidiary'])
export type AccountType = z.infer<typeof accountTypeSchema>

// Feeds the impact factor of BR-PR-01.
export const accountTierSchema = z.enum(['key', 'standard'])
export type AccountTier = z.infer<typeof accountTierSchema>

export const accountSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  type: accountTypeSchema,
  country: z.string().length(2),
  tier: accountTierSchema,
})
export type Account = z.infer<typeof accountSchema>

export const operatorSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  mode: modeSchema,
})
export type Operator = z.infer<typeof operatorSchema>

// BR-PM-01, resolved to names so the profile (UI-08) can render it.
export const perimeterSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('account'),
    account: accountSchema.pick({ id: true, name: true, type: true }),
  }),
  z.object({
    kind: z.literal('sites'),
    sites: z.array(siteSchema.pick({ id: true, name: true })),
  }),
  z.object({ kind: z.literal('all') }),
])
export type Perimeter = z.infer<typeof perimeterSchema>

export const userSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  email: z.email(),
  role: roleSchema,
  perimeter: perimeterSchema,
})
export type User = z.infer<typeof userSchema>

// GET /api/reference: filter options within the perimeter (OP-21).
export const referenceDataSchema = z.object({
  sites: z.array(siteSchema),
  operators: z.array(operatorSchema),
  accounts: z.array(accountSchema),
})
export type ReferenceData = z.infer<typeof referenceDataSchema>
