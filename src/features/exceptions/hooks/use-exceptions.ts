'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { ExceptionFilters } from '@/domain'
import { exceptionsService, queryKeys, referenceService } from '@/services'

// OP-01: `active` by default, sorted by BR-PR-02. With no filters it is the same query as the
// rail counter (UI-05), so both always agree.
export function useExceptions(filters: ExceptionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.exceptions.list(filters),
    queryFn: ({ signal }) => exceptionsService.list(filters, { signal }),
    placeholderData: keepPreviousData,
  })
}

// OP-10.
export function useException(id: string) {
  return useQuery({
    queryKey: queryKeys.exceptions.detail(id),
    queryFn: ({ signal }) => exceptionsService.getById(id, { signal }),
  })
}

// OP-04, OP-12: sites and operators within the perimeter.
export function useReferenceData() {
  return useQuery({
    queryKey: queryKeys.reference.all(),
    queryFn: ({ signal }) => referenceService.get({ signal }),
  })
}
