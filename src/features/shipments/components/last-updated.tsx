'use client'

import { TriangleAlert } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { useSimulationNow } from '@/features/simulator'
import { formatDayTime, formatDuration, formatRelative } from '@/lib/format-date'
import { cn } from '@/lib/utils'

interface LastUpdatedProps {
  lastEventAt: string | null
  // BR-TM-01: the simulation clock unless given.
  now?: Date
  className?: string
}

// SC-07: "Updated 2 h ago" in mono, from `lastEventAt`.
export function LastUpdated({ lastEventAt, now, className }: LastUpdatedProps) {
  const simulationNow = useSimulationNow()
  const classes = cn('font-mono text-xs text-ink-muted', className)
  if (lastEventAt === null) return <span className={classes}>No update yet</span>
  return (
    <Tooltip content={formatDayTime(lastEventAt)}>
      <time tabIndex={0} dateTime={lastEventAt} className={cn('rounded-xs', classes)}>
        Updated {formatRelative(lastEventAt, now ?? simulationNow)}
      </time>
    </Tooltip>
  )
}

interface StaleNoticeProps extends LastUpdatedProps {
  stale: boolean
}

// SC-07, BR-SL-02: a ruled `--risk` notice under the header, with an icon and words.
export function StaleNotice({ lastEventAt, stale, now, className }: StaleNoticeProps) {
  const simulationNow = useSimulationNow()
  if (!stale || lastEventAt === null) return null
  return (
    <p
      role="status"
      className={cn(
        'flex items-start gap-2 border-y border-risk bg-sheet px-4 py-2.5 text-sm text-ink md:px-8',
        className,
      )}
    >
      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-risk" strokeWidth={1.5} />
      No update from the operator for {formatDuration(lastEventAt, now ?? simulationNow)}.
      Information may be outdated.
    </p>
  )
}
