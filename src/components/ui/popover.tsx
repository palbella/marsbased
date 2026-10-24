'use client'

import { Popover as PopoverPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// shadcn/ui popover restyled with the tokens (03 §1.4): a ruled sheet, no shadow.
export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger

export function PopoverContent({
  className,
  align = 'end',
  sideOffset = 6,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn(
          'z-50 w-80 max-w-[calc(100vw-16px)] rounded-xs border border-rule bg-sheet p-4 text-ink',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
