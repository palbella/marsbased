import { z } from 'zod'
import { idSchema } from './primitives'

// BR-RT-01, 02 §7: thin events, IDs only, so nothing leaks across perimeters.
export const domainEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('shipment.updated'), shipmentId: idSchema }),
  z.object({ type: z.literal('exception.changed'), shipmentId: idSchema, exceptionId: idSchema }),
  z.object({ type: z.literal('alert.created'), shipmentId: idSchema, alertId: idSchema }),
  z.object({ type: z.literal('document.changed'), shipmentId: idSchema }),
  z.object({ type: z.literal('mapping.changed') }),
  z.object({ type: z.literal('data.reset') }),
])
export type DomainEvent = z.infer<typeof domainEventSchema>
export type DomainEventType = DomainEvent['type']
