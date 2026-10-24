'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type PropsWithChildren } from 'react'
import { SessionProvider } from '@/features/session'
import { monitoring } from '@/lib/monitoring'
import { createQueryClient } from '@/services'

// 02 §4: the root providers, inside MockProvider so no request leaves before the worker runs.
export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient)

  // 02 §5.8: unhandled promise rejections are reported from the root provider.
  useEffect(() => {
    const report = (event: PromiseRejectionEvent) =>
      monitoring.captureException(event.reason, { tags: { area: 'unhandled-rejection' } })
    window.addEventListener('unhandledrejection', report)
    return () => window.removeEventListener('unhandledrejection', report)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  )
}
