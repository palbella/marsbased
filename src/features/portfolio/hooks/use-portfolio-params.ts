'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import {
  nextSort,
  parsePortfolioParams,
  toPortfolioSearchParams,
  type PortfolioFilters,
  type PortfolioParams,
  type PortfolioSort,
  type SortKey,
} from '../portfolio-params'

// 02 §8, OP-21, OP-22: filters and sort live in the URL, so a view can be shared, reloaded and
// navigated with the back button.
export function usePortfolioParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = useMemo(
    () => parsePortfolioParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  )

  const navigate = useCallback(
    (next: PortfolioParams) => {
      const query = toPortfolioSearchParams(next).toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router],
  )

  const setFilters = useCallback(
    (changes: Partial<PortfolioFilters>) =>
      navigate({ ...params, filters: { ...params.filters, ...changes } }),
    [navigate, params],
  )
  const clearFilters = useCallback(() => navigate({ ...params, filters: {} }), [navigate, params])
  const sortBy = useCallback(
    (key: SortKey) => navigate({ ...params, sort: nextSort(params.sort, key) }),
    [navigate, params],
  )

  const setSort = useCallback(
    (sort: PortfolioSort | null) => navigate({ ...params, sort }),
    [navigate, params],
  )

  return { ...params, setFilters, clearFilters, sortBy, setSort }
}
