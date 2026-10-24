import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-10 w-full min-w-0 rounded-xs border border-rule bg-sheet px-3 text-sm text-ink',
        'placeholder:text-ink-muted aria-invalid:border-late disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
