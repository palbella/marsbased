'use client'

import Link from 'next/link'
import type { Exception, NextActionType } from '@/domain'
import { Button, buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { useQueryFailure } from '@/components/ui/use-query-failure'
import { useExceptions } from '../hooks/use-exceptions'
import { hasQueueFilters, type QueueFilters } from '../queue-filters'
import { TriageRow } from './triage-row'

interface QueueListProps {
  filters: QueueFilters
  onClearFilters: () => void
  onOpen: (exception: Exception) => void
  onAction: (exception: Exception, action: NextActionType) => void
}

// OP-01, OP-05: the exceptions in priority order (BR-PR-02, sorted by the API).
export function QueueList({ filters, onClearFilters, onOpen, onAction }: QueueListProps) {
  const exceptions = useExceptions(filters)
  const failure = useQueryFailure(exceptions)
  if (failure) {
    return <ErrorState retrying={failure.retrying} onRetry={() => exceptions.refetch()} />
  }
  if (!exceptions.isSuccess) return <LoadingState label="Loading the attention queue" rows={6} />
  if (exceptions.data.length === 0) {
    return <EmptyQueue filtered={hasQueueFilters(filters)} onClearFilters={onClearFilters} />
  }
  return (
    <ul aria-label="Attention queue" className="divide-y divide-rule border-b border-rule bg-sheet">
      {exceptions.data.map((exception) => (
        <TriageRow key={exception.id} exception={exception} onOpen={onOpen} onAction={onAction} />
      ))}
    </ul>
  )
}

function EmptyQueue({
  filtered,
  onClearFilters,
}: {
  filtered: boolean
  onClearFilters: () => void
}) {
  if (filtered) {
    return (
      <EmptyState
        stamp="NO MATCHES"
        message="No exceptions match these filters."
        action={
          <Button variant="secondary" onClick={onClearFilters}>
            Clear filters
          </Button>
        }
      />
    )
  }
  // OP-05, UI-10.
  return (
    <EmptyState
      stamp="ALL CLEAR"
      tone="ok"
      message="Nothing needs your attention right now."
      action={
        <Link href="/ops/shipments" className={buttonClasses('secondary')}>
          View all shipments
        </Link>
      }
    />
  )
}
