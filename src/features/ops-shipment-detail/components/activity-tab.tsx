'use client'

import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { useQueryFailure } from '@/components/ui/use-query-failure'
import { describeActivity } from '@/features/exceptions'
import { useShipmentActivity } from '@/features/shipments'
import { formatStamp } from '@/lib/format-date'

// OP-30 Activity tab: actions, automatic resolutions, messages sent and operator contacts, in
// the order they happened (the API sorts them).
export function ActivityTab({ shipmentId }: { shipmentId: string }) {
  const activity = useShipmentActivity(shipmentId)
  const failure = useQueryFailure(activity)
  if (failure) {
    return (
      <ErrorState
        message="Activity could not be loaded."
        retrying={failure.retrying}
        onRetry={() => activity.refetch()}
      />
    )
  }
  if (!activity.isSuccess) return <LoadingState label="Loading activity" rows={4} />
  if (activity.data.length === 0) {
    return (
      <p className="border-b border-rule bg-sheet px-4 py-4 text-sm text-ink-muted md:px-8">
        No activity on this shipment yet.
      </p>
    )
  }
  return (
    <ol aria-label="Activity" className="divide-y divide-rule border-b border-rule bg-sheet">
      {activity.data.map((entry) => (
        <li key={entry.id} className="flex flex-wrap gap-x-4 gap-y-0.5 px-4 py-2 text-sm md:px-8">
          <time dateTime={entry.at} className="w-28 shrink-0 font-mono text-xs leading-5">
            {formatStamp(entry.at)}
          </time>
          <span className="min-w-0 flex-1">
            {describeActivity(entry)}
            <span className="text-ink-muted"> · {entry.userName ?? 'System'}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}
