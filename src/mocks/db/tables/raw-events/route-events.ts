import type { Clock } from '@/mocks/clock'
import { eventBuilders } from './builders'
import { VALENCIA, VALENCIA_TERMINAL, VERACRUZ, WAREHOUSE } from './places'

const HOURS_PER_DAY = 24
// The upper bound for a vessel still at sea: positions are reported up to now.
export const NOW = 0

// Event sequences that follow the booking template in legs/multimodal.ts, given when the
// cargo reached the port of Valencia (hours relative to now). Each one is on time.
export function routeEvents(clock: Clock) {
  const { tir, pld, bws } = eventBuilders(clock)
  return {
    // Trans-Iberia: picked up 2 h before an 8 h drive to the port.
    tirToPort: (atPortHours: number, origin: string) => [
      tir('100', atPortHours - 10, origin),
      tir('200', atPortHours - 8, origin),
      tir('300', atPortHours, 'Valencia'),
    ],
    // PortLink: picked up 2 h before a 2 h drayage to the terminal.
    pldToPort: (atPortHours: number) => [
      pld('PICKUP', atPortHours - 4, WAREHOUSE),
      pld('DEPART', atPortHours - 2, WAREHOUSE),
      pld('GATE_IN', atPortHours, VALENCIA_TERMINAL),
    ],
    // Loaded 12 h before sailing, a day after reaching the port.
    sailed: (atPortHours: number, vessel: string) => [
      bws('LOAD', atPortHours + 12, vessel, VALENCIA),
      bws('VD', atPortHours + 24, vessel, VALENCIA),
    ],
    // 07 §4: one `POS` per day of voyage, after sailing and before arrival (or now), so a
    // vessel is never stale by silence alone (BR-SL-01).
    dailyPositions: (sailedHours: number, untilHours: number, vessel: string) =>
      Array.from({ length: Math.ceil((untilHours - sailedHours) / HOURS_PER_DAY) - 1 }, (_, day) =>
        bws('POS', sailedHours + (day + 1) * HOURS_PER_DAY, vessel, VERACRUZ),
      ),
  }
}
