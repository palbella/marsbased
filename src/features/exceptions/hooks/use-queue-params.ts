'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import {
  EXCEPTION_PARAM,
  parseQueueFilters,
  toQueueSearchParams,
  type QueueFilters,
} from '../queue-filters'

// OP-04, OP-10: the filters and the open exception live in the URL, so a view can be shared,
// reloaded and navigated with the back button.
export function useQueueParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const filters = useMemo(
    () => parseQueueFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  )
  const exceptionId = searchParams.get(EXCEPTION_PARAM)

  const navigate = useCallback(
    (nextFilters: QueueFilters, nextExceptionId: string | null) => {
      const query = toQueueSearchParams(nextFilters, nextExceptionId).toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router],
  )

  const setFilters = useCallback(
    (changes: Partial<QueueFilters>) => navigate({ ...filters, ...changes }, exceptionId),
    [exceptionId, filters, navigate],
  )
  const clearFilters = useCallback(() => navigate({}, exceptionId), [exceptionId, navigate])
  const openException = useCallback((id: string) => navigate(filters, id), [filters, navigate])
  const closeException = useCallback(() => navigate(filters, null), [filters, navigate])

  return { filters, setFilters, clearFilters, exceptionId, openException, closeException }
}
