import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full min-w-0 rounded-xs border border-rule bg-sheet px-3 py-2 text-sm text-ink',
        'placeholder:text-ink-muted aria-invalid:border-late disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
