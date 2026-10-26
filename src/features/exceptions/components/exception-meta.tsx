import { Ship, Truck } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { modeLabels, type Exception, type Mode, type Severity } from '@/domain'
import { cn } from '@/lib/utils'

// DS-08: the severity bar reinforces the severity word next to it, never replaces it (NFR-04).
export const severityBarClasses: Record<Severity, string> = {
  high: 'bg-late',
  medium: 'bg-risk',
  low: 'bg-unknown',
}

const MODE_ICONS = { road: Truck, sea: Ship }

// 03 §1.2 "Mode glyphs".
export function ModeGlyph({ mode }: { mode: Mode }) {
  const Icon = MODE_ICONS[mode]
  return (
    <>
      <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.5} />
      <span className="sr-only">{modeLabels[mode]}</span>
    </>
  )
}

// OP-02: the lifecycle states worth a word in the row and the panel (BR-EX-09).
export function stateChips(exception: Exception): string[] {
  const chips: string[] = []
  if (exception.status === 'acknowledged') chips.push('Acknowledged')
  if (exception.status === 'resolved') chips.push('Resolved')
  if (isWaitingOnOperator(exception)) chips.push('Waiting on operator')
  return chips
}

// BR-AC-02: a resolved exception waits on nobody, even if the operator never answered.
export function isWaitingOnOperator(exception: Exception): boolean {
  return exception.status !== 'resolved' && exception.waitingOn === 'operator'
}

export function StateChips({ exception, className }: { exception: Exception; className?: string }) {
  const chips = stateChips(exception)
  if (chips.length === 0) return null
  return (
    <span className={cn('inline-flex flex-wrap gap-1.5', className)}>
      {chips.map((chip) => (
        <StateChip key={chip}>{chip}</StateChip>
      ))}
    </span>
  )
}

export function StateChip({ children }: PropsWithChildren) {
  return (
    <span className="border border-ink-muted px-1.5 py-0.5 font-mono text-[11px] leading-none tracking-wide text-ink-muted uppercase">
      {children}
    </span>
  )
}
