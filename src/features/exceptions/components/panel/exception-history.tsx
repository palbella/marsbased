'use client'

import type { Exception } from '@/domain'
import { useShipmentActivity } from '@/features/shipments'
import { formatStamp } from '@/lib/format-date'
import { describeActivity, exceptionHistory } from '../../activity-description'

// OP-10, OP-15: the exception's history from the shipment's activity (BR-AC-*, BR-EX-07).
export function ExceptionHistory({ exception }: { exception: Exception }) {
  const activity = useShipmentActivity(exception.shipmentId)
  return (
    <section aria-labelledby="history-title" className="px-4 pt-6">
      <h3 id="history-title" className="field-label mb-2">
        History
      </h3>
      <HistoryEntries exceptionId={exception.id} activity={activity} />
    </section>
  )
}

function HistoryEntries({
  exceptionId,
  activity,
}: {
  exceptionId: string
  activity: ReturnType<typeof useShipmentActivity>
}) {
  if (activity.isPending) {
    return <span aria-label="Loading history" className="block h-4 w-2/3 animate-pulse bg-rule" />
  }
  if (activity.isError) {
    return (
      <p className="text-sm text-ink-muted">
        The history could not be loaded.{' '}
        <button type="button" onClick={() => activity.refetch()} className="underline">
          Retry
        </button>
      </p>
    )
  }
  const entries = exceptionHistory(activity.data, exceptionId)
  if (entries.length === 0) return <p className="text-sm text-ink-muted">No history yet.</p>
  return (
    <ol className="divide-y divide-rule border-y border-rule">
      {entries.map((entry) => (
        <li key={entry.id} className="flex flex-wrap gap-x-3 gap-y-0.5 py-2 text-sm">
          <time dateTime={entry.at} className="w-24 shrink-0 font-mono text-xs leading-5">
            {formatStamp(entry.at)}
          </time>
          <span className="min-w-0 flex-1">
            {describeActivity(entry)}
            {entry.userName && <span className="text-ink-muted"> · {entry.userName}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}
