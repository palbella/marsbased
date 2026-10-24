import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

// DS-03: a waybill field, small-caps label above its value. Render inside a `<dl>`.
interface FieldBlockProps {
  label: string
  className?: string
}

export function FieldBlock({ label, className, children }: PropsWithChildren<FieldBlockProps>) {
  return (
    <div className={cn('min-w-0 border-t border-rule px-4 py-3', className)}>
      <dt className="field-label">{label}</dt>
      <dd className="mt-1 text-sm break-words text-ink">{children}</dd>
    </div>
  )
}
