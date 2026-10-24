import { MutationObserver } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { shipmentListSchema } from '@/domain'
import { recentMonitoringEvents } from '@/lib/monitoring'
import { server } from '@/mocks/node'
import {
  alertsService,
  createQueryClient,
  NotFoundError,
  queryKeys,
  shipmentsService,
  simulatorService,
  TimeoutError,
  UnavailableError,
} from '@/services'
import { apiGet } from '@/services/api-client'
import { SLOW_TEST_TIMEOUT_MS, signInAs, setupMockApi, USERS } from './setup'

setupMockApi()

// Shorter than the Timeouts mode's 15 s latency, so the test doesn't wait the real 10 s.
const SHORT_TIMEOUT_MS = 500

function countRequests(pathSuffix: string): () => number {
  let count = 0
  server.events.on('request:start', ({ request }) => {
    if (new URL(request.url).pathname.endsWith(pathSuffix)) count += 1
  })
  return () => count
}

function capturedErrors(name: string) {
  return recentMonitoringEvents().filter(
    (event) => event.level === 'error' && event.errorName === name,
  )
}

describe('02 §5.6 timeouts', () => {
  it('a handler slower than the timeout ends in TimeoutError', async () => {
    await signInAs(USERS.marc)
    await simulatorService.setNetwork('timeouts')
    const request = apiGet('/shipments', shipmentListSchema, { timeoutMs: SHORT_TIMEOUT_MS })
    await expect(request).rejects.toBeInstanceOf(TimeoutError)
  })
})

describe('02 §5.6 retries', () => {
  it(
    'queries retry twice on UnavailableError, then report it to monitoring once',
    async () => {
      await signInAs(USERS.marc)
      await simulatorService.setNetwork('down')
      const requests = countRequests('/api/shipments')
      const query = createQueryClient().fetchQuery({
        queryKey: queryKeys.shipments.list({}),
        queryFn: ({ signal }) => shipmentsService.list({}, { signal }),
      })
      await expect(query).rejects.toBeInstanceOf(UnavailableError)
      expect(requests()).toBe(3)
      expect(capturedErrors('UnavailableError')).toHaveLength(1)
    },
    SLOW_TEST_TIMEOUT_MS,
  )

  it('queries do not retry other errors, which only leave a breadcrumb', async () => {
    await signInAs(USERS.marc)
    const requests = countRequests('/api/shipments/shp_999')
    const query = createQueryClient().fetchQuery({
      queryKey: queryKeys.shipments.detail('shp_999'),
      queryFn: ({ signal }) => shipmentsService.getById('shp_999', { signal }),
    })
    await expect(query).rejects.toBeInstanceOf(NotFoundError)
    expect(requests()).toBe(1)
    expect(capturedErrors('NotFoundError')).toHaveLength(0)
    expect(recentMonitoringEvents().at(-1)?.message).toMatch(
      /NotFoundError GET \/shipments\/shp_999/,
    )
  })

  it('mutations never retry', async () => {
    await signInAs(USERS.diego)
    await simulatorService.setNetwork('down')
    const requests = countRequests('/api/alerts/read-all')
    const mutation = new MutationObserver(createQueryClient(), {
      mutationFn: () => alertsService.markAllRead(),
    })
    await expect(mutation.mutate()).rejects.toBeInstanceOf(UnavailableError)
    expect(requests()).toBe(1)
    expect(capturedErrors('UnavailableError')).toHaveLength(1)
  })
})

describe('02 §5.6 failure modes', () => {
  it('the network endpoint is exempt, so API down can always be switched back', async () => {
    await signInAs(USERS.marc)
    await simulatorService.setNetwork('down')
    await expect(shipmentsService.list()).rejects.toBeInstanceOf(UnavailableError)
    expect(await simulatorService.getNetwork()).toEqual({ mode: 'down' })
    await simulatorService.setNetwork('normal')
    await expect(shipmentsService.list()).resolves.not.toHaveLength(0)
  })
})
