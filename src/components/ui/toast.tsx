'use client'

import { X } from 'lucide-react'
import { Toast as ToastPrimitive } from 'radix-ui'
import type { PropsWithChildren, ReactNode } from 'react'

// shadcn/ui toast restyled with the tokens (03 §1.4): a ruled sheet with a `--signal` edge,
// 2 px radius, no shadow. Radix announces it politely and pauses it on hover and focus.
const DURATION_MS = 8000

export function ToastProvider({ children }: PropsWithChildren) {
  return (
    <ToastPrimitive.Provider duration={DURATION_MS} swipeDirection="right">
      {children}
      <ToastPrimitive.Viewport className="fixed right-4 bottom-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 outline-none" />
    </ToastPrimitive.Provider>
  )
}

interface ToastProps {
  title: string
  // The one action, e.g. a link; Radix needs a text alternative for screen readers.
  action?: ReactNode
  actionAltText?: string
  onOpenChange: (open: boolean) => void
}

export function Toast({
  title,
  action,
  actionAltText,
  onOpenChange,
  children,
}: PropsWithChildren<ToastProps>) {
  return (
    <ToastPrimitive.Root
      onOpenChange={onOpenChange}
      className="flex items-start gap-3 rounded-xs border border-rule border-l-4 border-l-signal bg-sheet px-4 py-3 text-ink"
    >
      <div className="min-w-0 flex-1">
        <ToastPrimitive.Title className="text-sm font-semibold">{title}</ToastPrimitive.Title>
        {children && (
          <ToastPrimitive.Description className="mt-0.5 text-sm text-ink-muted">
            {children}
          </ToastPrimitive.Description>
        )}
        {action && actionAltText && (
          <ToastPrimitive.Action asChild altText={actionAltText}>
            {action}
          </ToastPrimitive.Action>
        )}
      </div>
      <ToastPrimitive.Close
        aria-label="Dismiss"
        className="rounded-xs p-0.5 text-ink-muted hover:text-ink"
      >
        <X aria-hidden className="size-4" strokeWidth={1.5} />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  )
}
