import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { monitoring } from '@/lib/monitoring'
import { UnavailableError } from './errors'

// 02 §5.6 "Retries": transient failures get two more tries, with back-off of 1 s then 2 s.
const MAX_QUERY_RETRIES = 2
const RETRY_BASE_DELAY_MS = 1_000

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: reportUnavailable }),
    mutationCache: new MutationCache({ onError: reportUnavailable }),
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        retryDelay: (attempt) => RETRY_BASE_DELAY_MS * 2 ** attempt,
      },
      // Never repeat a side effect without the user.
      mutations: { retry: false },
    },
  })
}

// `TimeoutError` is an `UnavailableError`. A 401/403/404/409/422 won't change by retrying.
function shouldRetryQuery(failureCount: number, error: Error): boolean {
  return error instanceof UnavailableError && failureCount < MAX_QUERY_RETRIES
}

// 02 §5.8: the cache's `onError` runs once, after the last retry. Contract errors are
// captured by the api-client and expected errors only leave a breadcrumb there.
function reportUnavailable(error: Error): void {
  if (!(error instanceof UnavailableError)) return
  monitoring.captureException(error, { request: error.request, tags: { area: 'api' } })
}
