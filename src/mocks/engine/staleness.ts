import type { Mode, ShipmentStatus } from '@/domain'
import { hoursBetween } from './time'

// BR-SL-01: expected update interval, in hours.
const UPDATE_INTERVAL_HOURS: Record<Mode, number> = { road: 12, sea: 48 }
const CUSTOMS_UPDATE_INTERVAL_HOURS = 24
// BR-SL-02: very stale beyond twice the interval.
const VERY_STALE_FACTOR = 2

const CUSTOMS_STATUSES: ShipmentStatus[] = ['in_customs', 'on_hold']

export interface Staleness {
  intervalHours: number
  stale: boolean
  veryStale: boolean
  // Hours since the last event; null before the first one.
  silentHours: number | null
}

// BR-SL-01, BR-SL-02. `lastEventAt` counts every event, mapped or not.
export function computeStaleness(
  status: ShipmentStatus,
  currentLegMode: Mode,
  lastEventAt: string | null,
  now: Date,
): Staleness {
  const intervalHours = CUSTOMS_STATUSES.includes(status)
    ? CUSTOMS_UPDATE_INTERVAL_HOURS
    : UPDATE_INTERVAL_HOURS[currentLegMode]
  const silentHours = lastEventAt === null ? null : hoursBetween(lastEventAt, now)
  // Delivered shipments are never stale; booked ones have nothing to be silent about yet.
  if (status === 'delivered' || silentHours === null) {
    return { intervalHours, stale: false, veryStale: false, silentHours }
  }
  return {
    intervalHours,
    stale: silentHours > intervalHours,
    veryStale: silentHours > intervalHours * VERY_STALE_FACTOR,
    silentHours,
  }
}
