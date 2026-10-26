'use client'

import { Suspense } from 'react'
import { LoadingState } from '@/components/ui/loading-state'
import { AttentionQueuePage } from '@/features/exceptions'

// US-O-01, OP-01..16: the filters and the open panel read the URL, which needs a Suspense
// boundary (02 §8).
export default function OpsHomePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading the attention queue" />}>
      <AttentionQueuePage />
    </Suspense>
  )
}
