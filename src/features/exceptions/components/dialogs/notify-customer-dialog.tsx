'use client'

import { useEffect, useState } from 'react'
import type { NotifyCustomerPayload } from '@/domain'
import { useDraftMessage } from '@/features/ai'
import { useExceptionAction } from '../../hooks/use-exception-action'
import { ActionDialog } from './action-dialog'
import type { ActionDialogProps } from './action-outcome'
import { DraftFields } from './draft-fields'

const EMPTY: NotifyCustomerPayload = { subject: '', message: '', requiresAction: false }

// OP-11, AI-3, BR-AC-01: the AI drafts, the agent edits and decides. The draft only fills the
// fields; nothing is sent until the agent presses Send (P3).
export function NotifyCustomerDialog({ exception, onClose, onDone }: ActionDialogProps) {
  const action = useExceptionAction(exception)
  const { values, change, draftState } = useDraftedValues(exception.id)
  const payload = { ...values, subject: values.subject.trim(), message: values.message.trim() }
  const submit = () =>
    action.mutate(
      { type: 'notify_customer', payload },
      {
        onSuccess: () =>
          onDone({
            title: `Customer notified about ${exception.shipmentReference}`,
            detail: `${exception.accountName} receives it as an alert.`,
          }),
      },
    )
  return (
    <ActionDialog
      title="Notify customer"
      submitLabel="Send"
      onClose={onClose}
      onSubmit={submit}
      canSubmit={payload.subject.length > 0 && payload.message.length > 0}
      pending={action.isPending}
      error={action.error}
    >
      <p className="text-sm text-ink-muted">
        To <span className="text-ink">{exception.accountName}</span> about{' '}
        <span className="font-mono text-ink">{exception.shipmentReference}</span>
      </p>
      <DraftFields values={values} onChange={change} {...draftState} />
    </ActionDialog>
  )
}

// The fields show the AI draft until the agent changes something; from then on, their edits.
function useDraftedValues(exceptionId: string) {
  const draft = useDraftMessage()
  const { mutate: requestDraft } = draft
  const [edits, setEdits] = useState<NotifyCustomerPayload | null>(null)
  useEffect(() => {
    requestDraft(exceptionId)
  }, [exceptionId, requestDraft])
  const values = edits ?? draft.data?.content ?? EMPTY
  const untouched = edits === null
  return {
    values,
    change: (changes: Partial<NotifyCustomerPayload>) => setEdits({ ...values, ...changes }),
    draftState: {
      draft: untouched ? draft.data : undefined,
      drafting: untouched && draft.isPending,
      draftFailed: untouched && draft.isError,
    },
  }
}
