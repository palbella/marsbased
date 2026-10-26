'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { z } from 'zod'

// 06 §4: the tabs of the ops shipment detail; Timeline is the default.
export const detailTabSchema = z.enum(['timeline', 'exceptions', 'documents', 'activity'])
export type DetailTab = z.infer<typeof detailTabSchema>
const DEFAULT_TAB: DetailTab = 'timeline'

// 02 §8, 06 §2: the tab and the open exception (`?exception=<id>`) live in the URL, so the view
// can be shared and survives a reload.
export function useDetailParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = detailTabSchema.safeParse(searchParams.get('tab')).data ?? DEFAULT_TAB
  const exceptionId = searchParams.get('exception')

  const navigate = useCallback(
    (nextTab: DetailTab, nextExceptionId: string | null) => {
      const params = new URLSearchParams()
      if (nextTab !== DEFAULT_TAB) params.set('tab', nextTab)
      if (nextExceptionId) params.set('exception', nextExceptionId)
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router],
  )

  return {
    tab,
    exceptionId,
    selectTab: (next: DetailTab) => navigate(next, exceptionId),
    openException: (id: string) => navigate(tab, id),
    closeException: () => navigate(tab, null),
  }
}
