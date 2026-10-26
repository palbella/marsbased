'use client'

import { Suspense } from 'react'
import { LoadingState } from '@/components/ui/loading-state'
import { PortfolioPage } from '@/features/portfolio'

// US-O-02, OP-20..23: the filters and the sort read the URL, which needs a Suspense boundary
// (02 §8).
export default function OpsShipmentsPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading shipments" />}>
      <PortfolioPage />
    </Suspense>
  )
}
