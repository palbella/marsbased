import { z } from 'zod'
import { idSchema, isoDateTimeSchema } from './primitives'

// 07 §3: each operator reports in its own format. Codes stay free strings on purpose:
// an unknown code must still be accepted and stored as unmapped (BR-NM-03).

export const operatorFormatSchema = z.enum([
  'tir-json',
  'eur-csv',
  'pld-json',
  'bws-edi',
  'lmx-text',
])
export type OperatorFormat = z.infer<typeof operatorFormatSchema>

export const tirPayloadSchema = z.object({
  code: z.string().min(1),
  ts: isoDateTimeSchema,
  location: z.string().min(1),
  eta: isoDateTimeSchema.nullable(),
})
export type TirPayload = z.infer<typeof tirPayloadSchema>

// "code;YYYY-MM-DD;HH:mm;place", e.g. "DP;2026-11-10;08:15;BARCELONA".
const EUR_CSV_LINE = /^[^;]+;\d{4}-\d{2}-\d{2};\d{2}:\d{2};[^;]+$/
export const eurPayloadSchema = z.string().regex(EUR_CSV_LINE)
export type EurPayload = z.infer<typeof eurPayloadSchema>

export const pldPayloadSchema = z.object({
  status: z.string().min(1),
  time: isoDateTimeSchema,
  terminal: z.string().min(1),
})
export type PldPayload = z.infer<typeof pldPayloadSchema>

export const bwsPayloadSchema = z.object({
  eventCode: z.string().min(1),
  isEstimate: z.boolean(),
  vessel: z.string().min(1),
  port: z.string().min(1),
  eventDateTime: isoDateTimeSchema,
})
export type BwsPayload = z.infer<typeof bwsPayloadSchema>

// Local Mexico City time, "DD/MM/YYYY HH:mm".
const LMX_LOCAL_DATE = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/
export const lmxPayloadSchema = z.object({
  status: z.string().min(1),
  date: z.string().regex(LMX_LOCAL_DATE),
  city: z.string().min(1),
})
export type LmxPayload = z.infer<typeof lmxPayloadSchema>

export const mappingStatusSchema = z.enum(['mapped', 'unmapped'])
export type MappingStatus = z.infer<typeof mappingStatusSchema>

const rawEventBaseSchema = z.object({
  id: idSchema,
  legId: idSchema,
  operatorId: idSchema,
  // Parsed from the payload by the operator's normaliser (04 §2).
  code: z.string().min(1),
  label: z.string().min(1),
  occurredAt: isoDateTimeSchema,
  receivedAt: isoDateTimeSchema,
  mappingStatus: mappingStatusSchema,
})

export const rawEventSchema = z.discriminatedUnion('format', [
  rawEventBaseSchema.extend({ format: z.literal('tir-json'), payload: tirPayloadSchema }),
  rawEventBaseSchema.extend({ format: z.literal('eur-csv'), payload: eurPayloadSchema }),
  rawEventBaseSchema.extend({ format: z.literal('pld-json'), payload: pldPayloadSchema }),
  rawEventBaseSchema.extend({ format: z.literal('bws-edi'), payload: bwsPayloadSchema }),
  rawEventBaseSchema.extend({ format: z.literal('lmx-text'), payload: lmxPayloadSchema }),
])
export type RawEvent = z.infer<typeof rawEventSchema>

export const rawEventListSchema = z.array(rawEventSchema)
