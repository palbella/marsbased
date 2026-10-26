'use client'

import { CircleAlert } from 'lucide-react'
import type { FormEvent, PropsWithChildren } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ConflictError, UnavailableError, ValidationError } from '@/services'

interface ActionDialogProps {
  title: string
  submitLabel: string
  onClose: () => void
  onSubmit: () => void
  canSubmit: boolean
  pending: boolean
  error: Error | null
}

// OP-11..16: the frame every action dialog shares. The fields live in the dialog's own
// state, so a failed request keeps what the agent typed (OP-16) and only the agent can send
// it again: mutations never retry on their own (02 §5.6).
export function ActionDialog({
  title,
  submitLabel,
  onClose,
  onSubmit,
  canSubmit,
  pending,
  error,
  children,
}: PropsWithChildren<ActionDialogProps>) {
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (canSubmit && !pending) onSubmit()
  }
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <form onSubmit={submit} className="flex flex-col gap-4 px-4 py-4">
          {children}
          {error && <ActionError error={error} />}
          <div className="flex flex-wrap justify-end gap-2 border-t border-rule pt-4">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!canSubmit || pending}>
              {submitButtonLabel(submitLabel, pending, error)}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function submitButtonLabel(label: string, pending: boolean, error: Error | null): string {
  if (pending) return 'Sending…'
  return error ? 'Try again' : label
}

function ActionError({ error }: { error: Error }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 border-l-2 border-late pl-3 text-sm text-late"
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
      {actionErrorMessage(error)}
    </p>
  )
}

// OP-16: what went wrong, in the agent's words; their input is still in the fields.
export function actionErrorMessage(error: Error): string {
  if (error instanceof ConflictError) {
    return 'This exception has already been resolved. Close the dialog to see its current state.'
  }
  if (error instanceof ValidationError) return `The request was rejected: ${error.message}`
  if (error instanceof UnavailableError) {
    return 'The service is unavailable. Nothing was sent; your text is kept, try again.'
  }
  return 'Something went wrong. Nothing was sent; your text is kept, try again.'
}
