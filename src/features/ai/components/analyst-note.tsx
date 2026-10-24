'use client'

import type { ReactNode } from 'react'
import { confidenceLevel, insightKindLabels, type AiInsight } from '@/domain'
import { Button } from '@/components/ui/button'
import { formatStamp } from '@/lib/format-date'
import { cn } from '@/lib/utils'
import { AnalystNoteSkeleton } from './analyst-note-skeleton'
import { EvidenceFootnotes } from './evidence-footnotes'

// The actionable variant (06 §2, OP-11): the AI proposes, the user decides (P3).
export interface AnalystNoteActions {
  onUse?: () => void
  onEdit?: () => void
  onDismiss?: () => void
}

interface AnalystNoteProps extends AnalystNoteActions {
  // null or undefined when there is nothing to show or the AI endpoint failed (SC-06).
  insight: AiInsight<unknown> | null | undefined
  loading?: boolean
  // Replaces the kind in the header, e.g. "Priority 92" (06 §2).
  heading?: string
  // The content, rendered by the caller for its kind.
  children: ReactNode
  className?: string
}

// SC-06, DS-06: every AI output as an analyst's margin note, never like magic.
export function AnalystNote({
  insight,
  loading = false,
  heading,
  children,
  className,
  ...actions
}: AnalystNoteProps) {
  if (loading) return <AnalystNoteSkeleton className={className} />
  if (!insight) return null
  const kind = heading ?? insightKindLabels[insight.kind]
  const level = confidenceLevel(insight.confidence)
  return (
    <aside
      aria-label={`AI note: ${kind}`}
      className={cn('border-l-2 border-predicted bg-sheet py-3 pr-4 pl-4', className)}
    >
      <p className="font-mono text-xs tracking-wider text-predicted uppercase">
        AI note · {kind} · Confidence {level}
      </p>
      <div className="mt-1.5 text-sm text-ink">{children}</div>
      <EvidenceFootnotes evidence={insight.evidence} />
      <p className="mt-2 font-mono text-[11px] text-ink-muted">
        Generated {formatStamp(insight.generatedAt)} · {insight.model}
      </p>
      <NoteActions {...actions} />
    </aside>
  )
}

function NoteActions({ onUse, onEdit, onDismiss }: AnalystNoteActions) {
  if (!onUse && !onEdit && !onDismiss) return null
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {onUse && (
        <Button size="small" onClick={onUse}>
          Use
        </Button>
      )}
      {onEdit && (
        <Button size="small" variant="secondary" onClick={onEdit}>
          Edit
        </Button>
      )}
      {onDismiss && (
        <Button size="small" variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
      )}
    </div>
  )
}
