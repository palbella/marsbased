import type { Mode } from '@/domain'
import type { Clock } from '@/mocks/clock'
import { multimodalLegs } from './legs/multimodal'
import { roadLegs } from './legs/road'

export interface LegRow {
  id: string
  shipmentId: string
  sequence: number
  mode: Mode
  operatorId: string
  from: string
  to: string
  plannedDeparture: string
  plannedArrival: string
  trackingNumber: string
  // Sea legs only; selects the delay factor of BR-AI-05.
  vessel: string | null
}

export function legsSeed(clock: Clock): LegRow[] {
  return [...roadLegs(clock), ...multimodalLegs(clock)]
}
