'use client'

import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { IS_NON_PRODUCTION } from '@/lib/environment'
import { queryKeys, simulatorService } from '@/services'

const MS_PER_HOUR = 60 * 60 * 1000
// Often enough that a minute-level relative time ("2 h ago", the strip clock) never lags.
const TICK_MS = 15_000

// BR-TM-01, OP-52: the simulation offset, refreshed by `simulator.changed` (BR-RT-01). The
// simulator only exists in non-production (OP-54).
export function useSimulationClock() {
  return useQuery({
    queryKey: queryKeys.simulator.clock(),
    queryFn: ({ signal }) => simulatorService.getClock({ signal }),
    enabled: IS_NON_PRODUCTION,
  })
}

// BR-TM-01: relative times read the simulation clock, never the browser's alone. Real time
// plus the offset (the mock answers from this same browser clock); while the offset is
// unknown, or outside non-production, it is the browser's time.
export function useSimulationNow(): Date {
  const clock = useSimulationClock()
  const realTime = useSyncExternalStore(subscribeToTicks, currentTick, currentTick)
  const offsetHours = clock.data?.offsetHours ?? 0
  return new Date(realTime + offsetHours * MS_PER_HOUR)
}

// One ticker shared by every component on the page.
const listeners = new Set<() => void>()
let tick = Date.now()
let timer: ReturnType<typeof setInterval> | null = null

function subscribeToTicks(listener: () => void): () => void {
  listeners.add(listener)
  timer ??= setInterval(() => {
    tick = Date.now()
    listeners.forEach((notify) => notify())
  }, TICK_MS)
  return () => {
    listeners.delete(listener)
    if (listeners.size > 0 || timer === null) return
    clearInterval(timer)
    timer = null
  }
}

function currentTick(): number {
  return tick
}
