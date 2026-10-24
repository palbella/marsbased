import type { ReactNode } from 'react'
import { StampedState } from './stamped-state'
import type { StampTone } from './stamp'

// UI-10, e.g. `ALL CLEAR`, `NOTHING IN TRANSIT`, `NOT FOUND`.
interface EmptyStateProps {
  stamp: string
  message: string
  tone?: StampTone
  action?: ReactNode
}

export function EmptyState({ stamp, message, tone = 'ink', action }: EmptyStateProps) {
  return <StampedState stamp={stamp} message={message} tone={tone} actions={action} />
}
