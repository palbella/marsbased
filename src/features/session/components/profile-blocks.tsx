'use client'

import { InfoIcon } from 'lucide-react'
import { perimeterFieldLabel, perimeterLabel, roleLabels } from '@/domain'
import { FieldBlock } from '@/components/ui/field-block'
import { useCurrentUser } from '../hooks/use-session'

// UI-08: read-only, from the session's `GET /api/auth/me`, as manifest blocks (DS-03).
export function ProfileBlocks() {
  const user = useCurrentUser()
  if (!user) return null

  return (
    <div className="px-4 py-6 md:px-8">
      <dl className="grid max-w-3xl grid-cols-1 border-b border-rule bg-sheet sm:grid-cols-2">
        <FieldBlock label="Name">{user.name}</FieldBlock>
        <FieldBlock label="Email">{user.email}</FieldBlock>
        <FieldBlock label="Role">{roleLabels[user.role]}</FieldBlock>
        <FieldBlock label={perimeterFieldLabel(user.perimeter)}>
          {perimeterLabel(user.perimeter)}
        </FieldBlock>
      </dl>
      <p className="mt-4 flex items-center gap-2 text-sm text-ink-muted">
        <InfoIcon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
        Profile details are managed by your organisation&apos;s administrator.
      </p>
    </div>
  )
}
