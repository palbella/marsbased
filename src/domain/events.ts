import { z } from 'zod'
import { idSchema } from './primitives'

// BR-RT-01, 02 §7: thin events, IDs only, so nothing leaks across perimeters.
export const domainEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('shipment.updated'), shipmentId: idSchema }),
  z.object({ type: z.literal('exception.changed'), shipmentId: idSchema, exceptionId: idSchema }),
  z.object({ type: z.literal('alert.created'), shipmentId: idSchema, alertId: idSchema }),
  z.object({ type: z.literal('document.changed'), shipmentId: idSchema }),
  z.object({ type: z.literal('mapping.changed') }),
  // Non-production: clock advance, scenario run, network mode change and reset.
  z.object({ type: z.literal('simulator.changed') }),
  z.object({ type: z.literal('data.reset') }),
])
export type DomainEvent = z.infer<typeof domainEventSchema>
export type DomainEventType = DomainEvent['type']

// 02 §7, Phase 1 transport: the publisher and the realtime client only share these names,
// as they share URLs over HTTP. The channel reaches every other tab; the window event is the
// local dispatch, because a `BroadcastChannel` never delivers to its sender.
export const REALTIME_CHANNEL = 'shipment-events'
export const REALTIME_LOCAL_EVENT = 'shipment-events:local'
