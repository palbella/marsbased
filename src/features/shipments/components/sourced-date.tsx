'use client'

import { Tooltip } from '@/components/ui/tooltip'
import { formatDay, formatDayTime, formatShortDay, formatStamp } from '@/lib/format-date'
import { cn } from '@/lib/utils'
import { sourceLabel, type DateWithBasis, type SourceContext } from '../source-label'
import { AiTag, ProvenanceText, provenanceClasses } from './provenance-style'

// `day`: "Thu 14 Nov"; `time`: "Thu 14 Nov 10:20"; `short`: "14 Nov", for the transit line.
export type DatePrecision = 'day' | 'time' | 'short'

interface SourcedDateProps extends SourceContext {
  // An ETA brings its `basis` for the "Our estimate, based on …" tooltip (SC-03).
  date: DateWithBasis
  precision?: DatePrecision
  // BR-ETA-05: the ETA of a very stale shipment.
  outdated?: boolean
  lastUpdatedAt?: string | null
  className?: string
}

// SC-03, DS-05: a date in provenance typography, with its source on hover and focus.
export function SourcedDate({
  date,
  precision = 'time',
  outdated = false,
  lastUpdatedAt = null,
  className,
  ...context
}: SourcedDateProps) {
  const { provenance } = date
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <Tooltip content={sourceLabel(date, context)}>
        <time
          tabIndex={0}
          dateTime={date.value}
          className={cn('rounded-xs whitespace-nowrap', provenanceClasses[provenance])}
        >
          <ProvenanceText provenance={provenance} text={formatDate(date.value, precision)} />
        </time>
      </Tooltip>
      {provenance === 'predicted' && <AiTag confidence={context.confidence} />}
      {outdated && <OutdatedNote lastUpdatedAt={lastUpdatedAt} />}
    </span>
  )
}

function OutdatedNote({ lastUpdatedAt }: { lastUpdatedAt: string | null }) {
  return (
    <span className="font-sans text-xs text-ink-muted not-italic">
      may be outdated
      {lastUpdatedAt && <> · last update {formatStamp(lastUpdatedAt)}</>}
    </span>
  )
}

function formatDate(iso: string, precision: DatePrecision): string {
  if (precision === 'day') return formatDay(iso)
  if (precision === 'short') return formatShortDay(iso)
  return formatDayTime(iso)
}
