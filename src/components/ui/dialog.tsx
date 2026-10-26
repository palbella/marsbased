'use client'

import { XIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { useReturnFocus } from './use-return-focus'

// shadcn/ui dialog restyled with the tokens (03 §1.4): a ruled sheet, 2 px radius, no shadow
// and no animation. Radix traps focus, closes on Esc and returns focus on close.
export const Dialog = DialogPrimitive.Root
export const DialogClose = DialogPrimitive.Close

interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  closeLabel?: string
}

export function DialogContent({
  closeLabel = 'Close',
  className,
  children,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props
}: DialogContentProps) {
  const returnFocus = useReturnFocus({ onOpenAutoFocus, onCloseAutoFocus })
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40" />
      <DialogPrimitive.Content
        aria-describedby={undefined}
        {...returnFocus}
        className={cn(
          'fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-xs border border-rule bg-sheet text-ink',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-xs hover:bg-current/10"
          aria-label={closeLabel}
        >
          <XIcon className="size-4" strokeWidth={1.5} aria-hidden />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        'border-b border-rule px-4 py-4 pr-12 font-condensed text-lg font-semibold tracking-wide uppercase',
        className,
      )}
      {...props}
    />
  )
}
