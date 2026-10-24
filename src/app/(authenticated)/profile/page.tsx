'use client'

import { PageHeader } from '@/components/ui/page-header'
import { ProfileBlocks } from '@/features/session'

// UI-08.
export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profile" />
      <ProfileBlocks />
    </>
  )
}
