'use client'

import { LogOutIcon, UserIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { roleLabels, type User } from '@/domain'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PROFILE_PATH, useSession } from '@/features/session'
import { initialsOf } from '../initials'

// UI-04: square initials avatar; the menu shows name and role, View profile and Sign out.
// After signing out the session guard sends the tab to /sign-in.
export function UserMenu({ user }: { user: User }) {
  const router = useRouter()
  const { signOut } = useSession()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${user.name}`}
        className="inline-flex size-9 items-center justify-center rounded-xs border border-paper/40 font-mono text-xs font-medium text-paper hover:bg-paper/10"
      >
        {initialsOf(user.name)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <span className="block text-sm font-medium">{user.name}</span>
          <span className="field-label">{roleLabels[user.role]}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(PROFILE_PATH)}>
          <UserIcon aria-hidden />
          View profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOutIcon aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
