'use client'

import type { ReactNode } from 'react'
import { formatDayTime } from '@/lib/format-date'
import { cn } from '@/lib/utils'
import type { TimelineEvent } from './interleave'
import { rowColumns, rowDensity } from './milestone-row'

interface EventRowProps {
  event: TimelineEvent
  renderRawEvent?: (rawEventId: string) => ReactNode
}

// 06 §4: an operator event with no milestone of its own, ops variant only. Its time is what
// the operator reported, so it sits in the Actual column; it has no plan.
export function EventRow({ event, renderRawEvent }: EventRowProps) {
  return (
    <li
      data-event={event.unmapped ? 'unmapped' : 'mapped'}
      className={cn(
        'grid grid-cols-1 items-center gap-x-4 gap-y-1 bg-paper/60 px-4 text-sm',
        rowDensity.ops,
        rowColumns.ops,
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span aria-hidden className="size-2.5 shrink-0 rotate-45 border border-ink-muted" />
        {event.unmapped ? (
          <span className="rounded-xs border border-late px-1.5 font-condensed text-xs font-semibold tracking-wider text-late uppercase">
            {event.label}
          </span>
        ) : (
          <span className="text-ink-muted">{event.label}</span>
        )}
      </span>
      <span className="text-ink-muted md:col-start-3">
        <span className="field-label mr-2 md:sr-only">Reported</span>
        <time dateTime={event.occurredAt}>{formatDayTime(event.occurredAt)}</time>
      </span>
      <span className="min-w-0 font-mono text-xs text-ink-muted">
        {renderRawEvent ? renderRawEvent(event.rawEventId) : '—'}
      </span>
    </li>
  )
}
