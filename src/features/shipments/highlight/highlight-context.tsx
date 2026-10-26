'use client'

import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react'
import type { EvidenceRef } from '@/domain'

// DS-06, SC-05: hovering or focusing a stop, a timeline row or an evidence footnote
// highlights the same thing everywhere on the page.
interface HighlightValue {
  active: EvidenceRef | null
  setActive: (ref: EvidenceRef | null) => void
}

// Without a provider nothing is highlighted, so each component still works on its own.
const NO_HIGHLIGHT: HighlightValue = { active: null, setActive: () => {} }

const HighlightContext = createContext<HighlightValue>(NO_HIGHLIGHT)

export function HighlightProvider({ children }: PropsWithChildren) {
  const [active, setActive] = useState<EvidenceRef | null>(null)
  const value = useMemo(() => ({ active, setActive }), [active])
  return <HighlightContext.Provider value={value}>{children}</HighlightContext.Provider>
}

function useHighlight(): HighlightValue {
  return useContext(HighlightContext)
}

// What an element on screen stands for. A raw event matches the milestone it filled
// (BR-NM-05), so a footnote citing an operator message lights up that stop.
export interface HighlightAnchor {
  milestoneIds?: readonly string[]
  rawEventIds?: readonly (string | undefined)[]
  documentId?: string
}

export function matchesHighlight(active: EvidenceRef | null, anchor: HighlightAnchor): boolean {
  if (active === null) return false
  if (active.kind === 'milestone') return anchor.milestoneIds?.includes(active.id) ?? false
  if (active.kind === 'raw_event') return anchor.rawEventIds?.includes(active.id) ?? false
  return anchor.documentId === active.id
}

// Hover and keyboard focus both set the highlight (NFR-04).
export function useHighlightTarget(anchor: HighlightAnchor, ref: EvidenceRef | null) {
  const { active, setActive } = useHighlight()
  const highlighted = matchesHighlight(active, anchor)
  const handlers = ref
    ? {
        onMouseEnter: () => setActive(ref),
        onMouseLeave: () => setActive(null),
        onFocus: () => setActive(ref),
        onBlur: () => setActive(null),
      }
    : {}
  return { highlighted, handlers }
}
