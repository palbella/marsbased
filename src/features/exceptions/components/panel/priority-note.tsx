'use client'

import { AnalystNote, usePriorityInsight } from '@/features/ai'

// OP-10, AI-2, BR-PR-03: why the exception ranks where it does, as an analyst note with the
// factors as evidence. Hidden when the AI endpoint fails (SC-06).
export function PriorityNote({ exceptionId }: { exceptionId: string }) {
  const insight = usePriorityInsight(exceptionId)
  return (
    <AnalystNote
      insight={insight.data}
      loading={insight.isPending}
      heading={insight.data ? `Priority ${insight.data.content.score}` : undefined}
      className="mx-4 mt-4"
    >
      {insight.data?.content.rationale}
    </AnalystNote>
  )
}
