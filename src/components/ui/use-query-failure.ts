import { useState } from 'react'

interface QueryStatus {
  error: Error | null
  isSuccess: boolean
  isFetching: boolean
}

export interface QueryFailure {
  error: Error
  // A refetch runs after the failure: Retry, a realtime event or the tab regaining focus.
  retrying: boolean
}

// 02 §5.6 "Where errors are shown": in TanStack Query v5 a refetch of a query that never had
// data puts it back to `pending` and clears its error, which would swap an errored block
// back to its skeleton. The block keeps its last error until data arrives.
export function useQueryFailure(query: QueryStatus): QueryFailure | null {
  const [lastError, setLastError] = useState<Error | null>(null)
  if (query.error && query.error !== lastError) setLastError(query.error)
  if (query.isSuccess && lastError) setLastError(null)
  const error = query.error ?? (query.isSuccess ? null : lastError)
  if (!error) return null
  return { error, retrying: query.isFetching }
}
