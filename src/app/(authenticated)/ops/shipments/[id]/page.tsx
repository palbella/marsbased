'use client'

import { Suspense, use } from 'react'
import { LoadingState } from '@/components/ui/loading-state'
import { OpsShipmentDetail } from '@/features/ops-shipment-detail'

// US-O-04, OP-30: the tab and the open exception read the URL, which needs a Suspense
// boundary (02 §8).
export default function OpsShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <Suspense fallback={<LoadingState label="Loading shipment" />}>
      <OpsShipmentDetail id={id} />
    </Suspense>
  )
}
