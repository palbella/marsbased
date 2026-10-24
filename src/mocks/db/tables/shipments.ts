import type { Clock } from '@/mocks/clock'
import { domesticShipments } from './shipments/domestic'
import { euShipments } from './shipments/eu'
import { multimodalShipments } from './shipments/multimodal'

export interface ShipmentRow {
  id: string
  reference: string
  accountId: string
  originSiteId: string
  destinationCity: string
  destinationCountry: string
  // The delivery date committed to the customer at booking time.
  plannedEta: string
}

// 07 §4. SD-01: every date is an offset from the clock's "now".
export function shipmentsSeed(clock: Clock): ShipmentRow[] {
  return [...domesticShipments(clock), ...euShipments(clock), ...multimodalShipments(clock)]
}
