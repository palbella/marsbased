import type { Tables } from '@/mocks/db/schema'
import { loadShipmentFacts, type ShipmentFacts } from '@/mocks/engine/facts'
import { deriveShipment, type ShipmentView } from '@/mocks/engine/shipment-view'
import { notFound } from '@/mocks/http'

// 02 §5.5 rule 4: stored facts plus what the engine derives from them on read.
export interface LoadedShipment {
  facts: ShipmentFacts
  view: ShipmentView
  // When it was derived, for relative wording in responses (e.g. the ETA basis).
  now: Date
}

export type ShipmentLoader = (shipmentId: string) => LoadedShipment

// Memoised per request, so a list touching one shipment many times derives it once.
export function createShipmentLoader(db: Tables, now: Date): ShipmentLoader {
  const loaded = new Map<string, LoadedShipment>()
  return (shipmentId) => {
    const cached = loaded.get(shipmentId)
    if (cached) return cached
    const facts = loadShipmentFacts(db, shipmentId)
    if (!facts) throw notFound()
    const shipment = { facts, view: deriveShipment(facts, now), now }
    loaded.set(shipmentId, shipment)
    return shipment
  }
}
