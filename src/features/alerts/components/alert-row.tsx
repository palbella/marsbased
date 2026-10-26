'use client'

import Link from 'next/link'
import type { Alert } from '@/domain'
import { formatDayTime, formatTime } from '@/lib/format-date'
import { cn } from '@/lib/utils'
import { isUnread, useMarkAlertRead } from '../hooks/use-alerts'
import { EtaImpact } from './eta-impact'

// `time` in the *Today* group ("10:42"), `day` elsewhere ("Mon 3 Nov 08:15").
export type AlertTimeFormat = 'time' | 'day'

interface AlertRowProps {
  alert: Alert
  timeFormat?: AlertTimeFormat
}

// CP-21, BR-AL-03: reference, title, what happened, ETA impact and "Action needed". The row
// is one link (stretched over it); opening it marks the alert as read.
export function AlertRow({ alert, timeFormat = 'day' }: AlertRowProps) {
  const markRead = useMarkAlertRead()
  const unread = isUnread(alert)
  const open = () => {
    if (unread) markRead.mutate(alert.id)
  }
  return (
    <li className="relative flex min-h-16 gap-3 px-4 py-3 hover:bg-paper md:px-6">
      <UnreadDot unread={unread} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <time dateTime={alert.createdAt} className="font-mono text-xs text-ink-muted">
            {timeFormat === 'time' ? formatTime(alert.createdAt) : formatDayTime(alert.createdAt)}
          </time>
          <span className="font-mono text-sm">{alert.shipmentReference}</span>
          <Link
            href={`/portal/shipments/${alert.shipmentId}`}
            onClick={open}
            className={cn('text-sm after:absolute after:inset-0', unread && 'font-semibold')}
          >
            {unread && <span className="sr-only">Unread: </span>}
            {alert.title}
          </Link>
          {alert.requiresAction && <ActionNeeded />}
        </p>
        <p className="text-sm text-ink-muted">{alert.message}</p>
        {alert.etaImpact && <EtaImpact impact={alert.etaImpact} />}
      </div>
    </li>
  )
}

// CP-20: unread alerts are marked with a dot; the word is in the link for screen readers.
function UnreadDot({ unread }: { unread: boolean }) {
  return (
    <span aria-hidden className="mt-1.5 flex size-2 shrink-0">
      {unread && <span className="size-2 rounded-full bg-signal" />}
    </span>
  )
}

function ActionNeeded() {
  return (
    <span className="border border-late px-1.5 font-condensed text-xs font-semibold tracking-wider text-late uppercase">
      Action needed
    </span>
  )
}
