import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// 03 §1.2 "Field labels".
export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('field-label block', className)} {...props} />
}
