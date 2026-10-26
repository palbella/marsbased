import type { Exception } from '@/domain'

// OP-15: what the confirmation toast and the panel say after an action.
export interface ActionOutcome {
  title: string
  detail?: string
}

export interface ActionDialogProps {
  exception: Exception
  onClose: () => void
  onDone: (outcome: ActionOutcome) => void
}
