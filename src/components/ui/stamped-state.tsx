import type { AriaRole, ReactNode } from 'react'
import { Stamp, type StampTone } from './stamp'

// UI-10: the layout shared by empty, error and not-found states: stamp, one short specific
// message, and the action(s).
export interface StampedStateProps {
  stamp: string
  message: string
  tone?: StampTone
  role?: AriaRole
  actions?: ReactNode
}

export function StampedState({ stamp, message, tone, role, actions }: StampedStateProps) {
  return (
    <div role={role} className="flex flex-col items-start gap-5 px-4 py-12 md:px-8">
      <Stamp tone={tone}>{stamp}</Stamp>
      <p className="max-w-prose text-sm text-ink-muted">{message}</p>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
