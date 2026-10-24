'use client'

import { BellIcon } from 'lucide-react'
import Link from 'next/link'
import { useRailCounters } from '../hooks/use-rail-counters'
import { navigation } from '../navigation'

const ALERTS_HREF = '/portal/alerts'

// UI-03, US-C-04: customers only. Shares the rail's unread query; hidden count on failure.
export function AlertsBell() {
  const { unreadAlerts } = useRailCounters(navigation.customer)
  const label = unreadAlerts === undefined ? 'Alerts' : `Alerts, ${unreadAlerts} unread`

  return (
    <Link
      href={ALERTS_HREF}
      aria-label={label}
      className="relative inline-flex size-9 items-center justify-center rounded-xs text-paper hover:bg-paper/10"
    >
      <BellIcon className="size-4" strokeWidth={1.5} aria-hidden />
      {unreadAlerts !== undefined && unreadAlerts > 0 && (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 min-w-4 rounded-xs bg-signal px-1 text-center font-mono text-[11px] leading-4 text-ink"
        >
          {unreadAlerts}
        </span>
      )}
    </Link>
  )
}
