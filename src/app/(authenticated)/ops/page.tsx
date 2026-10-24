'use client'

import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

// TEMPORARY (T06): placeholder for the attention queue (US-O-01, DS-08), replaced in T09.
export default function OpsHomePage() {
  return (
    <>
      <PageHeader title="Attention queue" subtitle="Operations console" />
      <EmptyState stamp="IN PREPARATION" message="The attention queue is on its way." />
    </>
  )
}
