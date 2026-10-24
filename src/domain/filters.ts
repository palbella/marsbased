import { z } from 'zod'
import { exceptionStatusSchema, exceptionTypeSchema } from './exception'
import { idSchema, modeSchema } from './primitives'
import { onTimeIndicatorSchema, shipmentStatusSchema } from './shipment'

// CP-04: active shipments or those delivered in the last 7 days.
export const shipmentViewSchema = z.enum(['active', 'delivered'])
export type ShipmentView = z.infer<typeof shipmentViewSchema>

// OP-21: destination type.
export const destinationScopeSchema = z.enum(['domestic', 'international'])
export type DestinationScope = z.infer<typeof destinationScopeSchema>

// GET /api/shipments query parameters (02 §5.2).
export const shipmentFiltersSchema = z.object({
  view: shipmentViewSchema.optional(),
  status: shipmentStatusSchema.optional(),
  onTime: onTimeIndicatorSchema.optional(),
  site: idSchema.optional(),
  operator: idSchema.optional(),
  mode: modeSchema.optional(),
  scope: destinationScopeSchema.optional(),
  // Reference contains, case-insensitive (CP-04).
  q: z.string().trim().min(1).optional(),
})
export type ShipmentFilters = z.infer<typeof shipmentFiltersSchema>

// GET /api/exceptions query parameters (02 §5.2).
export const exceptionFiltersSchema = z.object({
  status: exceptionStatusSchema.optional(),
  type: exceptionTypeSchema.optional(),
  site: idSchema.optional(),
  operator: idSchema.optional(),
  mode: modeSchema.optional(),
  shipmentId: idSchema.optional(),
})
export type ExceptionFilters = z.infer<typeof exceptionFiltersSchema>

// GET /api/alerts query parameters (02 §5.2).
export const alertFiltersSchema = z.object({
  shipmentId: idSchema.optional(),
})
export type AlertFilters = z.infer<typeof alertFiltersSchema>
