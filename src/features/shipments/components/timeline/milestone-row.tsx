'use client'

import type { ReactNode } from 'react'
import {
  milestoneLabels,
  milestoneStateLabels,
  type Milestone,
  type MilestoneState,
} from '@/domain'
import { cn } from '@/lib/utils'
import { useHighlightTarget } from '../../highlight/highlight-context'
import type { OperatorNames } from '../../source-label'
import { SourcedDate } from '../sourced-date'

export type TimelineVariant = 'customer' | 'ops'

// 03 §1.2: customer rows 64 px, ops rows 36 px.
export const rowDensity: Record<TimelineVariant, string> = {
  customer: 'min-h-16 py-3',
  ops: 'min-h-9 py-1.5',
}

// Planned, actual and, in ops, the raw event (06 §4).
export const rowColumns: Record<TimelineVariant, string> = {
  customer: 'md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]',
  ops: 'md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)]',
}

// BR-MS-04: done filled, not reported hollow, overdue `--late` outline, pending `--rule`.
const markerClasses: Record<MilestoneState, string> = {
  done: 'bg-ink border-ink',
  not_reported: 'bg-transparent border-ink',
  overdue: 'bg-transparent border-late border-2',
  pending: 'bg-transparent border-rule border-2',
}

interface MilestoneRowProps {
  milestone: Milestone
  variant: TimelineVariant
  operators: OperatorNames
  renderRawEvent?: (rawEventId: string) => ReactNode
}

// SC-05: one stop of the timeline. The state is a shape and a word, never colour alone.
export function MilestoneRow({ milestone, variant, operators, renderRawEvent }: MilestoneRowProps) {
  const { highlighted, handlers } = useHighlightTarget(
    { milestoneIds: [milestone.id], rawEventIds: [milestone.rawEventId] },
    { kind: 'milestone', id: milestone.id },
  )
  const { state, planned, actual, rawEventId } = milestone
  return (
    <li
      data-milestone={milestone.type}
      data-state={state}
      data-highlighted={highlighted || undefined}
      className={cn(
        'grid grid-cols-1 items-center gap-x-4 gap-y-1 px-4 text-sm',
        rowDensity[variant],
        rowColumns[variant],
        highlighted && 'bg-signal/15',
      )}
      {...handlers}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span aria-hidden className={cn('size-2.5 shrink-0 border', markerClasses[state])} />
        <span className="min-w-0">
          <span className="text-ink">{milestoneLabels[milestone.type]}</span>
          <StateWord state={state} />
        </span>
      </span>
      <DateCell label="Planned" date={planned} operators={operators} />
      <DateCell label="Actual" date={actual} operators={operators} />
      {variant === 'ops' && (
        <span className="min-w-0 font-mono text-xs text-ink-muted">
          {rawEventId && renderRawEvent ? renderRawEvent(rawEventId) : '—'}
        </span>
      )}
    </li>
  )
}

function StateWord({ state }: { state: MilestoneState }) {
  const label = milestoneStateLabels[state]
  if (state === 'done') return <span className="sr-only"> · {label}</span>
  const tone = state === 'overdue' ? 'text-late' : 'text-ink-muted'
  return <span className={cn('block text-xs', tone)}>{label}</span>
}

interface DateCellProps {
  label: string
  date: Milestone['planned']
  operators: OperatorNames
}

function DateCell({ label, date, operators }: DateCellProps) {
  return (
    <span className="flex min-w-0 items-baseline gap-2">
      <span className="field-label w-14 shrink-0 md:sr-only">{label}</span>
      {date ? (
        <SourcedDate date={date} operators={operators} />
      ) : (
        <span className="text-ink-muted">—</span>
      )}
    </span>
  )
}
