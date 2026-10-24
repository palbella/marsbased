'use client'

import { useEffect, useState } from 'react'

// Often enough that the minute never lags visibly.
const TICK_MS = 15_000

// en-GB gives a 24 h clock and the short zone name, e.g. "14:32 CET" (DS-01).
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
})

// DS-01: local time. The simulation offset (`SIM +n h`) joins in T11.
export function StripClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), TICK_MS)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <time dateTime={now.toISOString()} className={className}>
      {timeFormat.format(now)}
    </time>
  )
}
