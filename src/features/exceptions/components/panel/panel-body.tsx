'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Exception, ExceptionActionType, NextActionType } from '@/domain'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { SectionErrorBoundary } from '@/components/ui/section-error-boundary'
import { SheetTitle } from '@/components/ui/sheet'
import { useQueryFailure } from '@/components/ui/use-query-failure'
import { NotFoundError } from '@/services'
import { useException } from '../../hooks/use-exceptions'
import type { ActionOutcome } from '../dialogs/action-outcome'
import { ExceptionActionDialog } from '../dialogs/exception-action-dialog'
import { ExceptionHistory } from './exception-history'
import { NextActions } from './next-actions'
import { PanelHeader } from './panel-header'
import { PanelShipment } from './panel-shipment'
import { PriorityNote } from './priority-note'

interface PanelBodyProps {
  exceptionId: string
  requestedAction: NextActionType | null
  onActionDone: (outcome: ActionOutcome) => void
}

// OP-10: loads the exception; each independent block has its own error boundary (02 §5.6).
export function PanelBody({ exceptionId, requestedAction, onActionDone }: PanelBodyProps) {
  const exception = useException(exceptionId)
  const failure = useQueryFailure(exception)
  if (failure) {
    return (
      <>
        <SheetTitle className="sr-only">Exception</SheetTitle>
        {failure.error instanceof NotFoundError ? (
          <EmptyState stamp="NOT FOUND" message="This exception is not in your perimeter." />
        ) : (
          <ErrorState retrying={failure.retrying} onRetry={() => exception.refetch()} />
        )}
      </>
    )
  }
  if (!exception.isSuccess) {
    return (
      <>
        <SheetTitle className="sr-only">Exception</SheetTitle>
        <LoadingState label="Loading exception" />
      </>
    )
  }
  return (
    <PanelContent
      exception={exception.data}
      requestedAction={requestedAction}
      onActionDone={onActionDone}
    />
  )
}

interface PanelContentProps extends Omit<PanelBodyProps, 'exceptionId'> {
  exception: Exception
}

function PanelContent({ exception, requestedAction, onActionDone }: PanelContentProps) {
  const [action, setAction] = useState<ExceptionActionType | null>(null)
  const [outcome, setOutcome] = useState<ActionOutcome | null>(null)
  // Opened after the first render, once the sheet holds the focus, so closing the dialog
  // returns the focus inside the panel.
  useEffect(() => {
    if (requestedAction) setAction(requestedAction)
  }, [requestedAction])
  const done = (result: ActionOutcome) => {
    setAction(null)
    setOutcome(result)
    onActionDone(result)
  }
  return (
    <article aria-label={`Exception on ${exception.shipmentReference}`} className="pb-8">
      <PanelHeader exception={exception} />
      {outcome && (
        <p role="status" className="border-b border-rule bg-paper px-4 py-3 text-sm">
          <span className="font-semibold">{outcome.title}.</span> {outcome.detail}
        </p>
      )}
      <PanelSections exception={exception} onSelectAction={setAction} />
      {action && (
        <ExceptionActionDialog
          action={action}
          exception={exception}
          onClose={() => setAction(null)}
          onDone={done}
        />
      )}
    </article>
  )
}

interface PanelSectionsProps {
  exception: Exception
  onSelectAction: (action: ExceptionActionType) => void
}

function PanelSections({ exception, onSelectAction }: PanelSectionsProps) {
  return (
    <>
      <SectionErrorBoundary section="exception-shipment">
        <PanelShipment exception={exception} />
      </SectionErrorBoundary>
      <SectionErrorBoundary section="ai-priority">
        <PriorityNote exceptionId={exception.id} />
      </SectionErrorBoundary>
      <NextActions exception={exception} onSelect={onSelectAction} />
      <SectionErrorBoundary section="exception-history">
        <ExceptionHistory exception={exception} />
      </SectionErrorBoundary>
      <div className="flex justify-end px-4 pt-6">
        <Link href={`/ops/shipments/${exception.shipmentId}`} className={buttonClasses('ghost')}>
          Open shipment →
        </Link>
      </div>
    </>
  )
}
