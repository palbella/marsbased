'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { Wordmark } from '@/components/ui/wordmark'
import { IS_NON_PRODUCTION } from '@/lib/environment'
import { useSession } from '../hooks/use-session'
import { useSignInForm, type SignInFormState } from '../hooks/use-sign-in-form'
import type { Session } from '../session-context'
import { resolveNextPath } from '../session-routes'
import { SignInForm } from './sign-in-form'
import { SignInHero } from './sign-in-hero'
import { TestAccounts } from './test-accounts'

// UI-06: outside the shell, split in two; below 768 px only the form panel, wordmark on top.
// A signed-in tab (just signed in, or opening /sign-in) goes to `next` or its home.
export function SignInScreen() {
  const { session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const form = useSignInForm()
  const next = searchParams.get('next')
  const target = session.status === 'signed-in' ? resolveNextPath(next, session.user.role) : null

  useEffect(() => {
    if (target !== null) router.replace(target)
  }, [target, router])

  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <SignInHero className="hidden md:flex" />
      <main className="flex flex-col justify-center px-4 py-10 md:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Wordmark layout="stacked" className="mb-10 md:hidden" />
          <SignInPanel
            session={session}
            form={form}
            expired={searchParams.get('reason') === 'expired'}
          />
        </div>
      </main>
    </div>
  )
}

interface SignInPanelProps {
  session: Session
  form: SignInFormState
  expired: boolean
}

function SignInPanel({ session, form, expired }: SignInPanelProps) {
  if (session.status === 'unavailable') return <ErrorState onRetry={session.retry} />
  if (session.status !== 'signed-out') {
    return <LoadingState rows={2} label="Opening" className="px-0" />
  }
  return (
    <>
      <SignInForm form={form} expired={expired} />
      {IS_NON_PRODUCTION && <TestAccounts onUse={form.fill} />}
    </>
  )
}
