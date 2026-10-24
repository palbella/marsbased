'use client'

import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

// TEMPORARY (T06): placeholder for the arrivals agenda (US-C-01, DS-09), replaced in T08.
export default function PortalHomePage() {
  return (
    <>
      <PageHeader title="Arrivals" subtitle="Customer portal" />
      <EmptyState stamp="IN PREPARATION" message="Your arrivals agenda is on its way." />
    </>
  )
}
