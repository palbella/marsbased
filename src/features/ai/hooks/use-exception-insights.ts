'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { aiService, queryKeys } from '@/services'

// OP-10, AI-2: the priority rationale; a failure hides the note (SC-06).
export function usePriorityInsight(exceptionId: string) {
  return useQuery({
    queryKey: queryKeys.ai.priority(exceptionId),
    queryFn: ({ signal }) => aiService.getPriority(exceptionId, { signal }),
  })
}

// OP-11, AI-3: a POST that only proposes a draft; nothing is sent until the agent presses
// Send (P3). Like every mutation, it never retries on its own (02 §5.6).
export function useDraftMessage() {
  return useMutation({
    mutationFn: (exceptionId: string) => aiService.draftMessage(exceptionId),
  })
}
