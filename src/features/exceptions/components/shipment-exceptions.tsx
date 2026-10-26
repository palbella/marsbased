'use client'

import { exceptionTypeLabels, severityLabels, type Exception } from '@/domain'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { useQueryFailure } from '@/components/ui/use-query-failure'
import { formatStamp } from '@/lib/format-date'
import { cn } from '@/lib/utils'
import { useExceptions } from '../hooks/use-exceptions'
import { severityBarClasses, StateChips } from './exception-meta'

interface ShipmentExceptionsProps {
  shipmentId: string
  onOpen: (exception: Exception) => void
}

// OP-30 Exceptions tab: open and resolved exceptions of one shipment
// (`GET /api/exceptions?shipmentId=&status=all`); opening one shows the panel (06 §2).
export function ShipmentExceptions({ shipmentId, onOpen }: ShipmentExceptionsProps) {
  const exceptions = useExceptions({ shipmentId, status: 'all' })
  const failure = useQueryFailure(exceptions)
  if (failure) {
    return (
      <ErrorState
        message="Exceptions could not be loaded."
        retrying={failure.retrying}
        onRetry={() => exceptions.refetch()}
      />
    )
  }
  if (!exceptions.isSuccess) return <LoadingState label="Loading exceptions" rows={3} />
  if (exceptions.data.length === 0) {
    return (
      <p className="border-b border-rule bg-sheet px-4 py-4 text-sm text-ink-muted md:px-8">
        No exceptions on this shipment.
      </p>
    )
  }
  return (
    <ul aria-label="Exceptions" className="divide-y divide-rule border-b border-rule bg-sheet">
      {exceptions.data.map((exception) => (
        <ExceptionRow key={exception.id} exception={exception} onOpen={onOpen} />
      ))}
    </ul>
  )
}

function ExceptionRow({
  exception,
  onOpen,
}: {
  exception: Exception
  onOpen: ShipmentExceptionsProps['onOpen']
}) {
  const type = exceptionTypeLabels[exception.type]
  const resolved = exception.status === 'resolved'
  return (
    <li
      className={cn(
        'relative grid grid-cols-[4px_minmax(0,1fr)] gap-x-3 py-2 pr-4 hover:bg-paper md:pr-8',
        resolved && 'text-ink-muted',
      )}
    >
      <span aria-hidden className={resolved ? 'bg-rule' : severityBarClasses[exception.severity]} />
      <div className="min-w-0 space-y-1">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <button
            type="button"
            onClick={() => onOpen(exception)}
            aria-label={`Open ${type.toLowerCase()} exception`}
            className="rounded-xs font-condensed font-semibold tracking-wider uppercase after:absolute after:inset-0"
          >
            {type} · {severityLabels[exception.severity]}
          </button>
          <span className="font-mono text-xs">
            Raised <time dateTime={exception.detectedAt}>{formatStamp(exception.detectedAt)}</time>
          </span>
          <StateChips exception={exception} />
          {!resolved && (
            <span className="font-mono text-xs">Priority {exception.priorityScore}</span>
          )}
        </p>
        <p className="text-sm">{exception.reason}</p>
      </div>
    </li>
  )
}
