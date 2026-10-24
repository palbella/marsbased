'use client'

import { Tooltip as TooltipPrimitive } from 'radix-ui'
import type { ComponentProps, ReactNode } from 'react'

// shadcn/ui tooltip restyled with the tokens (03 §1.4): an ink label, 2 px radius, no shadow.
// Radix opens it on hover and on keyboard focus (NFR-04), so its trigger must be focusable.
const OPEN_DELAY_MS = 200

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: ComponentProps<typeof TooltipPrimitive.Content>['side']
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={OPEN_DELAY_MS}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            collisionPadding={8}
            className="z-50 max-w-72 rounded-xs bg-ink px-2.5 py-1.5 font-sans text-xs leading-snug text-paper"
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
