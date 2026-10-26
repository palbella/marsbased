'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useExceptionAction } from '../../hooks/use-exception-action'
import { ActionDialog } from './action-dialog'
import type { ActionDialogProps } from './action-outcome'

// OP-14, BR-AC-04: assigns the exception to the agent.
export function AcknowledgeDialog({ exception, onClose, onDone }: ActionDialogProps) {
  const action = useExceptionAction(exception)
  const submit = () =>
    action.mutate(
      { type: 'acknowledge', payload: {} },
      { onSuccess: () => onDone({ title: `${exception.shipmentReference} acknowledged` }) },
    )
  return (
    <ActionDialog
      title="Acknowledge exception"
      submitLabel="Acknowledge"
      onClose={onClose}
      onSubmit={submit}
      canSubmit
      pending={action.isPending}
      error={action.error}
    >
      <p className="text-sm">
        The exception on <span className="font-mono">{exception.shipmentReference}</span> will be
        assigned to you.
      </p>
    </ActionDialog>
  )
}

// OP-14, BR-AC-05, BR-EX-08: a note is required, even if the condition still holds.
export function ResolveDialog({ exception, onClose, onDone }: ActionDialogProps) {
  const action = useExceptionAction(exception)
  const [note, setNote] = useState('')
  const submit = () =>
    action.mutate(
      { type: 'resolve', payload: { note: note.trim() } },
      { onSuccess: () => onDone({ title: `${exception.shipmentReference} resolved` }) },
    )
  return (
    <ActionDialog
      title="Resolve exception"
      submitLabel="Resolve"
      onClose={onClose}
      onSubmit={submit}
      canSubmit={note.trim().length > 0}
      pending={action.isPending}
      error={action.error}
    >
      <div className="space-y-1.5">
        <Label htmlFor="resolve-note">Resolution note (required)</Label>
        <Textarea
          id="resolve-note"
          required
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
    </ActionDialog>
  )
}
