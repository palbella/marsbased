'use client'

import { Suspense } from 'react'
import { SignInScreen } from '@/features/session'

// UI-06, UI-07. Suspense because the screen reads `next` and `reason` from the URL.
export default function SignInPage() {
  return (
    <Suspense>
      <SignInScreen />
    </Suspense>
  )
}
