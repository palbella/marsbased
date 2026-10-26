'use client'

import { useState } from 'react'
import { perimeterLabel, type Exception, type NextActionType } from '@/domain'
import { PageHeader } from '@/components/ui/page-header'
import { useCurrentUser } from '@/features/session'
import { useQueueParams } from '../hooks/use-queue-params'
import { ExceptionPanel } from './panel/exception-panel'
import { QueueCounters } from './queue-counters'
import { QueueFilterBar } from './queue-filter-bar'
import { QueueList } from './queue-list'

// US-O-01, OP-01..05: the ops home is the attention queue, not a list of shipments (P2).
export function AttentionQueuePage() {
  const user = useCurrentUser()
  const queue = useQueueParams()
  // The dialog a row's primary action asks for; the panel opens it once it is shown.
  const [requestedAction, setRequestedAction] = useState<NextActionType | null>(null)
  const open = (exception: Exception) => {
    setRequestedAction(null)
    queue.openException(exception.id)
  }
  const runPrimary = (exception: Exception, action: NextActionType) => {
    setRequestedAction(action)
    queue.openException(exception.id)
  }
  return (
    <>
      <PageHeader
        title="Attention queue"
        subtitle={user ? `Ops · ${perimeterLabel(user.perimeter)}` : undefined}
        actions={<QueueCounters filters={queue.filters} onChange={queue.setFilters} />}
      />
      <QueueFilterBar filters={queue.filters} onChange={queue.setFilters} />
      <QueueList
        filters={queue.filters}
        onClearFilters={queue.clearFilters}
        onOpen={open}
        onAction={runPrimary}
      />
      <ExceptionPanel
        exceptionId={queue.exceptionId}
        requestedAction={requestedAction}
        onClose={queue.closeException}
      />
    </>
  )
}
