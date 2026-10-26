'use client'

import { use } from 'react'
import { ShipmentDetail } from '@/features/shipment-detail'

// US-C-02, CP-10..16.
export default function PortalShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <ShipmentDetail id={id} />
}
