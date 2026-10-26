'use client'

import { useState } from 'react'
import type { NextActionType } from '@/domain'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Toast, ToastProvider } from '@/components/ui/toast'
import type { ActionOutcome } from '../dialogs/action-outcome'
import { PanelBody } from './panel-body'

interface ExceptionPanelProps {
  // From `?exception=<id>`; null closes the panel.
  exceptionId: string | null
  // A row's primary action: its dialog opens over the panel.
  requestedAction?: NextActionType | null
  onClose: () => void
}

interface ShownToast extends ActionOutcome {
  id: number
}

// OP-10..16: the exception panel as a side sheet. It stays mounted, so the confirmation
// toasts (OP-15) outlive the dialog and the panel. Also opened from the ops shipment detail
// (OP-30 Exceptions tab).
export function ExceptionPanel({
  exceptionId,
  requestedAction = null,
  onClose,
}: ExceptionPanelProps) {
  const [toasts, setToasts] = useState<ShownToast[]>([])
  const confirm = (outcome: ActionOutcome) =>
    setToasts((current) => [...current, { ...outcome, id: Date.now() }])
  const dismiss = (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id))
  return (
    <ToastProvider>
      <Sheet open={exceptionId !== null} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          closeLabel="Close exception panel"
          className="w-full max-w-full overflow-y-auto bg-sheet text-ink md:w-[560px]"
        >
          {exceptionId && (
            <PanelBody
              key={exceptionId}
              exceptionId={exceptionId}
              requestedAction={requestedAction}
              onActionDone={confirm}
            />
          )}
        </SheetContent>
      </Sheet>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          onOpenChange={(open) => !open && dismiss(toast.id)}
        >
          {toast.detail}
        </Toast>
      ))}
    </ToastProvider>
  )
}
