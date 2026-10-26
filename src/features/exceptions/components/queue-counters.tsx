'use client'

import { exceptionTypeLabels, exceptionTypeSchema, type ExceptionType } from '@/domain'
import { cn } from '@/lib/utils'
import { useExceptions } from '../hooks/use-exceptions'
import type { QueueFilters } from '../queue-filters'

interface QueueCountersProps {
  filters: QueueFilters
  onChange: (changes: Partial<QueueFilters>) => void
}

// OP-04: one counter per type in the page header, each a filter. They count the queue under
// every filter except the type one, so they don't drop to zero while a type is selected.
// Like any counter, they are hidden while loading or on failure (02 §5.6).
export function QueueCounters({ filters, onChange }: QueueCountersProps) {
  const exceptions = useExceptions({ ...filters, type: undefined })
  if (!exceptions.data) return null
  const counts = countByType(exceptions.data)
  return (
    <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-x-1 gap-y-1">
      {exceptionTypeSchema.options.map((type) => {
        const selected = filters.type === type
        return (
          <button
            key={type}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange({ type: selected ? undefined : type })}
            className={cn(
              'rounded-xs px-2 py-1 font-condensed text-sm font-semibold tracking-wider uppercase',
              selected ? 'bg-ink text-paper' : 'hover:bg-sheet',
              !selected && counts[type] === 0 && 'text-ink-muted',
            )}
          >
            {exceptionTypeLabels[type]} <span className="font-mono">{counts[type]}</span>
          </button>
        )
      })}
    </div>
  )
}

function countByType(exceptions: { type: ExceptionType }[]): Record<ExceptionType, number> {
  const counts: Record<ExceptionType, number> = {
    delay: 0,
    hold: 0,
    stale: 0,
    customs_incident: 0,
    missing_document: 0,
  }
  for (const { type } of exceptions) counts[type] += 1
  return counts
}
