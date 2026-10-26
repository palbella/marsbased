'use client'

import {
  confidenceLevel,
  insightKindLabels,
  type DraftMessageInsight,
  type NotifyCustomerPayload,
} from '@/domain'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface DraftFieldsProps {
  values: NotifyCustomerPayload
  onChange: (changes: Partial<NotifyCustomerPayload>) => void
  // The untouched AI draft; undefined once the agent edits anything.
  draft: DraftMessageInsight | undefined
  drafting: boolean
  draftFailed: boolean
}

// OP-11, DS-06: while the fields hold the untouched draft they are framed as an analyst note;
// the first edit turns them into normal fields. The fields keep their place in the tree, so
// typing never loses focus when the frame goes away.
export function DraftFields({ values, onChange, draft, drafting, draftFailed }: DraftFieldsProps) {
  return (
    <div
      aria-busy={drafting}
      className={cn('space-y-3', draft && 'border-l-2 border-predicted bg-paper py-3 pr-3 pl-3')}
    >
      <DraftStatus draft={draft} drafting={drafting} draftFailed={draftFailed} />
      <div className="space-y-1.5">
        <Label htmlFor="notify-subject">Subject</Label>
        <Input
          id="notify-subject"
          required
          value={values.subject}
          onChange={(event) => onChange({ subject: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notify-message">Message</Label>
        <Textarea
          id="notify-message"
          required
          rows={9}
          value={values.message}
          onChange={(event) => onChange({ message: event.target.value })}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.requiresAction}
          onChange={(event) => onChange({ requiresAction: event.target.checked })}
          className="size-4 accent-ink"
        />
        Customer action required
      </label>
    </div>
  )
}

function DraftStatus({
  draft,
  drafting,
  draftFailed,
}: Omit<DraftFieldsProps, 'values' | 'onChange'>) {
  if (draft) {
    return (
      <p className="font-mono text-xs tracking-wider text-predicted uppercase">
        AI note · {insightKindLabels.draft} · Confidence {confidenceLevel(draft.confidence)}
        <span className="mt-1 block font-sans text-xs tracking-normal text-ink-muted normal-case">
          A proposal: review and edit it. Nothing is sent until you press Send.
        </span>
      </p>
    )
  }
  if (drafting) {
    return (
      <p role="status" className="font-mono text-xs tracking-wider text-predicted uppercase">
        AI note · Drafting a message…
      </p>
    )
  }
  if (draftFailed) {
    return (
      <p role="status" className="text-sm text-ink-muted">
        No AI draft is available. Write the message yourself.
      </p>
    )
  }
  return null
}
