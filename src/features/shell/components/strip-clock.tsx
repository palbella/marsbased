'use client'

import { useSimulationClock, useSimulationNow } from '@/features/simulator'

// en-GB gives a 24 h clock and the short zone name, e.g. "14:32 CET" (DS-01).
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
})

// DS-01, BR-TM-01: the simulation time, the same "now" every relative time reads, with its
// offset (`14:32 CET · SIM +2 h`) while the simulator has moved the clock.
export function StripClock({ className }: { className?: string }) {
  const now = useSimulationNow()
  const offsetHours = useSimulationClock().data?.offsetHours ?? 0
  return (
    <span className={className}>
      <time dateTime={now.toISOString()}>{timeFormat.format(now)}</time>
      {offsetHours > 0 && <span> · SIM +{offsetHours} h</span>}
    </span>
  )
}
