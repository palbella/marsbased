'use client'

import { Suspense } from 'react'
import { LoadingState } from '@/components/ui/loading-state'
import { ArrivalsPage } from '@/features/arrivals'

// US-C-01: the filters read the URL, which needs a Suspense boundary (02 §8).
export default function PortalHomePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading arrivals" />}>
      <ArrivalsPage />
    </Suspense>
  )
}
