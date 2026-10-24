import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { server } from '@/mocks/node'

// Node's fetch needs an absolute URL; any origin reaches the handler.
const TEST_ORIGIN = 'http://localhost'

describe('GET /api/health (T01)', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterAll(() => server.close())

  it('answers from the mock API', async () => {
    const response = await fetch(`${TEST_ORIGIN}/api/health`)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok', mocked: true })
  })
})
