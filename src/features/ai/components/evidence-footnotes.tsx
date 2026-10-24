'use client'

import type { Evidence, EvidenceRef } from '@/domain'
import { useHighlightTarget, type HighlightAnchor } from '@/features/shipments'
import { cn } from '@/lib/utils'

// DS-06: evidence as numbered footnotes. One that cites a stop, an event or a document
// highlights it on hover and focus, which makes the grounding visible (P1, P3).
export function EvidenceFootnotes({ evidence }: { evidence: Evidence[] }) {
  if (evidence.length === 0) return null
  return (
    <ol
      aria-label="Evidence"
      className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted"
    >
      {evidence.map((item, index) => (
        <li key={index}>
          {item.ref ? (
            <LinkedFootnote number={index + 1} text={item.text} evidenceRef={item.ref} />
          ) : (
            <FootnoteText number={index + 1} text={item.text} />
          )}
        </li>
      ))}
    </ol>
  )
}

function LinkedFootnote({
  number,
  text,
  evidenceRef,
}: {
  number: number
  text: string
  evidenceRef: EvidenceRef
}) {
  const { highlighted, handlers } = useHighlightTarget(anchorOf(evidenceRef), evidenceRef)
  return (
    <button
      type="button"
      data-highlighted={highlighted || undefined}
      className={cn(
        'rounded-xs text-left underline decoration-dotted underline-offset-4 hover:text-ink',
        highlighted && 'bg-signal/15 text-ink',
      )}
      {...handlers}
    >
      <FootnoteText number={number} text={text} />
    </button>
  )
}

function FootnoteText({ number, text }: { number: number; text: string }) {
  return (
    <>
      <span className="font-mono text-predicted">[{number}]</span> {text}
    </>
  )
}

function anchorOf(ref: EvidenceRef): HighlightAnchor {
  if (ref.kind === 'milestone') return { milestoneIds: [ref.id] }
  if (ref.kind === 'raw_event') return { rawEventIds: [ref.id] }
  return { documentId: ref.id }
}
