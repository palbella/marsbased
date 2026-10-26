import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// A native select in the tokens: the platform's own keyboard and mobile pickers.
export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-10 min-w-0 rounded-xs border border-rule bg-sheet px-2 text-sm text-ink disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
