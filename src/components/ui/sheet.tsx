'use client'

import { XIcon } from 'lucide-react'
import { Dialog as SheetPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { useReturnFocus } from './use-return-focus'

// shadcn/ui sheet restyled with the tokens (03 §1.4): hairline edge, no shadow and no slide
// animation (motion is limited to DS-04 and DS-07). Radix traps focus and closes on Esc.
export const Sheet = SheetPrimitive.Root
export const SheetTitle = SheetPrimitive.Title
export const SheetClose = SheetPrimitive.Close

const sideClasses = {
  left: 'inset-y-0 left-0 border-r',
  right: 'inset-y-0 right-0 border-l',
}

interface SheetContentProps extends ComponentProps<typeof SheetPrimitive.Content> {
  side?: keyof typeof sideClasses
  closeLabel?: string
}

export function SheetContent({
  side = 'right',
  closeLabel = 'Close',
  className,
  children,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props
}: SheetContentProps) {
  const returnFocus = useReturnFocus({ onOpenAutoFocus, onCloseAutoFocus })
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40" />
      <SheetPrimitive.Content
        aria-describedby={undefined}
        {...returnFocus}
        className={cn(
          'fixed z-50 flex h-full w-80 max-w-[85vw] flex-col border-rule',
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close
          className="absolute top-3 right-3 inline-flex size-8 items-center justify-center rounded-xs hover:bg-current/10"
          aria-label={closeLabel}
        >
          <XIcon className="size-4" strokeWidth={1.5} aria-hidden />
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}
