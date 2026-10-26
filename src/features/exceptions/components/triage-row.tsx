'use client'

import {
  exceptionActionLabels,
  exceptionTypeLabels,
  severityLabels,
  type Exception,
  type NextActionType,
} from '@/domain'
import { Button } from '@/components/ui/button'
import { useSimulationNow } from '@/features/simulator'
import { formatDuration } from '@/lib/format-date'
import { cn } from '@/lib/utils'
import { ModeGlyph, severityBarClasses, StateChips } from './exception-meta'

interface TriageRowProps {
  exception: Exception
  onOpen: (exception: Exception) => void
  onAction: (exception: Exception, action: NextActionType) => void
}

// OP-02, OP-03, DS-08: a ruled board row. The open button is stretched over the row, so the
// primary action keeps its own target; on mobile every part wraps to its own line.
export function TriageRow({ exception, onOpen, onAction }: TriageRowProps) {
  const [primary] = exception.nextActions
  return (
    <li className="relative grid grid-cols-[4px_3rem_minmax(0,1fr)] gap-x-3 gap-y-2 py-2.5 pr-4 hover:bg-paper md:grid-cols-[4px_3rem_minmax(0,1fr)_auto] md:pr-6">
      <span
        aria-hidden
        className={cn('row-span-2 md:row-span-1', severityBarClasses[exception.severity])}
      />
      <span className="font-mono text-3xl leading-none font-semibold tracking-tighter">
        <span className="sr-only">Priority </span>
        {exception.priorityScore}
      </span>
      <div className="min-w-0 space-y-1">
        <RowFacts exception={exception} onOpen={onOpen} />
        <p className="text-sm text-ink">{exception.reason}</p>
        {exception.priorityFactors.length > 0 && (
          <p className="field-label">{exception.priorityFactors.join(' · ')}</p>
        )}
      </div>
      {primary && (
        <Button
          size="small"
          className="relative z-10 col-start-3 self-start justify-self-start md:col-start-auto"
          onClick={() => onAction(exception, primary)}
          aria-label={`${exceptionActionLabels[primary]} for ${exception.shipmentReference}`}
        >
          {exceptionActionLabels[primary]}
        </Button>
      )}
    </li>
  )
}

function RowFacts({ exception, onOpen }: Pick<TriageRowProps, 'exception' | 'onOpen'>) {
  const type = exceptionTypeLabels[exception.type]
  const severity = severityLabels[exception.severity]
  const openFor = formatDuration(exception.detectedAt, useSimulationNow())
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <span className="font-condensed font-semibold tracking-wider uppercase">
        {type} · {severity}
      </span>
      <button
        type="button"
        onClick={() => onOpen(exception)}
        aria-label={`Open ${type.toLowerCase()} exception on ${exception.shipmentReference}`}
        className="rounded-xs font-mono font-medium after:absolute after:inset-0"
      >
        {exception.shipmentReference}
      </button>
      <span>{exception.accountName}</span>
      <span className="inline-flex items-center gap-1.5 text-ink-muted">
        {exception.operatorName}
        <ModeGlyph mode={exception.mode} />
      </span>
      <span className="font-mono text-xs text-ink-muted">open {openFor}</span>
      <StateChips exception={exception} />
    </p>
  )
}
