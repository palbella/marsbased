'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { parseArrivalFilters, toSearchParams, type ArrivalFilters } from '../arrival-filters'

// 02 §8, CP-04: filters live in the URL, so views are shareable and back-button friendly.
export function useArrivalFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const filters = useMemo(
    () => parseArrivalFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  )

  const setFilters = useCallback(
    (changes: Partial<ArrivalFilters>) => {
      const query = toSearchParams({ ...filters, ...changes }).toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [filters, pathname, router],
  )

  return { filters, setFilters }
}
