import { z } from 'zod'

// BR-TM-02: timestamps are exchanged as ISO 8601 UTC.
export const isoDateTimeSchema = z.iso.datetime()

export const idSchema = z.string().min(1)

export const nonEmptyTextSchema = z.string().trim().min(1)

export const modeSchema = z.enum(['road', 'sea'])
export type Mode = z.infer<typeof modeSchema>
