import { z } from 'zod'
import { idSchema, isoDateTimeSchema, modeSchema } from './primitives'
import { sourcedDateSchema } from './provenance'

// BR-ST-01, BR-ST-02.
export const shipmentStatusSchema = z.enum([
  'booked',
  'in_transit',
  'at_port',
  'in_customs',
  'on_hold',
  'out_for_delivery',
  'delivered',
])
export type ShipmentStatus = z.infer<typeof shipmentStatusSchema>

// BR-OT-01, BR-OT-02.
export const onTimeIndicatorSchema = z.enum(['on_time', 'at_risk', 'late', 'unknown'])
export type OnTimeIndicator = z.infer<typeof onTimeIndicatorSchema>

export const destinationSchema = z.object({
  city: z.string().min(1),
  country: z.string().length(2),
  international: z.boolean(),
})
export type Destination = z.infer<typeof destinationSchema>

export const legSchema = z.object({
  id: idSchema,
  sequence: z.number().int().positive(),
  mode: modeSchema,
  operatorId: idSchema,
  operatorName: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  plannedDeparture: isoDateTimeSchema,
  plannedArrival: isoDateTimeSchema,
  trackingNumber: z.string().min(1),
  vessel: z.string().min(1).nullable(),
})
export type Leg = z.infer<typeof legSchema>

// BR-ETA-05: a very stale shipment keeps its ETA and provenance, flagged as outdated.
export const etaSchema = sourcedDateSchema.extend({
  outdated: z.boolean(),
  // The operator event an `estimated` ETA derives from (BR-ETA-02/03), for traceability (P1).
  rawEventId: idSchema.nullable(),
})
export type Eta = z.infer<typeof etaSchema>

export const shipmentSchema = z.object({
  id: idSchema,
  reference: z.string().min(1),
  accountId: idSchema,
  accountName: z.string().min(1),
  originSiteId: idSchema,
  originSiteName: z.string().min(1),
  destination: destinationSchema,
  legs: z.array(legSchema).min(1),
  // BR-MS-06.
  currentLegId: idSchema,
  status: shipmentStatusSchema,
  // null = unknown, never a placeholder date (P1).
  eta: etaSchema.nullable(),
  // Committed delivery date at booking time.
  plannedEta: isoDateTimeSchema,
  onTime: onTimeIndicatorSchema,
  // null until the first operator event arrives (booked shipments).
  lastEventAt: isoDateTimeSchema.nullable(),
  // BR-SL-02.
  stale: z.boolean(),
  // Ops only: customers never see exceptions (CP-16, BR-PM-04).
  openExceptionCount: z.number().int().nonnegative().optional(),
})
export type Shipment = z.infer<typeof shipmentSchema>

// The list and the detail share one shape (02 §5.3, §5.4).
export const shipmentListSchema = z.array(shipmentSchema)
