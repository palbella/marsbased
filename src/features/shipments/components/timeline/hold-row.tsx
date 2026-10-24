'use client'

import type { ReactNode } from 'react'
import { milestoneLabels, type CustomsHold } from '@/domain'
import { Stamp } from '@/components/ui/stamp'
import { cn } from '@/lib/utils'
import { useHighlightTarget } from '../../highlight/highlight-context'
import type { OperatorNames } from '../../source-label'
import { SourcedDate } from '../sourced-date'
import { rowColumns, rowDensity, type TimelineVariant } from './milestone-row'

interface HoldRowProps {
  hold: CustomsHold
  variant: TimelineVariant
  operators: OperatorNames
  renderRawEvent?: (rawEventId: string) => ReactNode
}

// SC-05, BR-MS-05: a customs hold on the customs block; an open one is stamped.
export function HoldRow({ hold, variant, operators, renderRawEvent }: HoldRowProps) {
  const { highlighted, handlers } = useHighlightTarget(
    { rawEventIds: [hold.rawEventId] },
    { kind: 'raw_event', id: hold.rawEventId },
  )
  return (
    <li
      data-milestone="customs_hold"
      data-highlighted={highlighted || undefined}
      className={cn(
        'grid grid-cols-1 items-center gap-x-4 gap-y-1 px-4 text-sm',
        rowDensity[variant],
        rowColumns[variant],
        highlighted && 'bg-signal/15',
      )}
      {...handlers}
    >
      <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-ink">{milestoneLabels.customs_hold}</span>
        {hold.open ? (
          <Stamp tone="late" className="px-2 py-1 text-sm">
            On hold
          </Stamp>
        ) : (
          <span className="text-xs text-ink-muted">Released</span>
        )}
      </span>
      <span className="text-ink-muted md:col-start-3">
        <span className="field-label mr-2 md:sr-only">Reported</span>
        <SourcedDate date={hold.reportedAt} operators={operators} />
      </span>
      {variant === 'ops' && (
        <span className="min-w-0 font-mono text-xs text-ink-muted">
          {renderRawEvent ? renderRawEvent(hold.rawEventId) : '—'}
        </span>
      )}
    </li>
  )
}
