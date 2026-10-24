import type { Eta, OnTimeIndicator, ShipmentStatus } from '@/domain'

// BR-AL-01: the engine's last evaluation of a shipment, so the next one can tell what
// changed. `id` is the shipment id: one row per shipment.
export interface ShipmentEvaluationRow {
  id: string
  onTime: OnTimeIndicator
  eta: Eta
  status: ShipmentStatus
  evaluatedAt: string
}

// Written by every recomputation; seeding fills it while replaying the facts (SD-02).
export const shipmentEvaluationsSeed: ShipmentEvaluationRow[] = []
