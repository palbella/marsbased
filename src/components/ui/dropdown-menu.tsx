'use client'

import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// shadcn/ui dropdown menu restyled with the tokens (03 §1.4): a ruled sheet, no shadow, the
// highlighted item marked with a `--signal` bar like the rail (DS-02). Radix provides the
// keyboard behaviour UI-04 requires (Enter/Space, arrows, Esc).
export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-56 rounded-xs border border-rule bg-sheet py-1 text-ink',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return <DropdownMenuPrimitive.Label className={cn('px-3 py-2', className)} {...props} />
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'flex cursor-default items-center gap-2 border-l-[3px] border-transparent px-3 py-2 text-sm outline-none select-none',
        'data-highlighted:border-signal data-highlighted:bg-paper [&_svg]:size-4 [&_svg]:stroke-[1.5]',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator className={cn('my-1 h-px bg-rule', className)} {...props} />
  )
}
