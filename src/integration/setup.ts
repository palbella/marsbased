import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import type { User } from '@/domain'
import { clearMonitoringEvents } from '@/lib/monitoring'
import { MOCK_USER_PASSWORD } from '@/mocks/auth'
import { database } from '@/mocks/db/instance'
import { setFailureMode } from '@/mocks/failure-mode'
import { server } from '@/mocks/node'
import { authService } from '@/services'
import { tokenStore } from '@/services/token-store'

// 07 §2.
export const USERS = {
  laura: 'laura.gomez@albaretail.test',
  jordi: 'jordi.serra@nexo.test',
  ana: 'ana.ruiz@talleresruiz.test',
  camille: 'camille.durand@durand.test',
  diego: 'diego.hernandez@corvane-mx.test',
  marc: 'marc.puig@corvane.test',
  nuria: 'nuria.vidal@corvane.test',
  elena: 'elena.martin@corvane.test',
} as const

// Every request takes 150–400 ms (NFR-05), and the retry tests wait for the back-off.
export const SLOW_TEST_TIMEOUT_MS = 20_000

// Services against the real handlers over `msw/node` (02 §10); each test starts signed out,
// on the Normal network and with an empty monitoring log.
export function setupMockApi(): void {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
    // The console reporter's output; tests read its ring buffer instead.
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })
  afterEach(() => {
    server.resetHandlers()
    server.events.removeAllListeners()
    setFailureMode('normal')
    tokenStore.clear()
    clearMonitoringEvents()
  })
  afterAll(() => {
    server.close()
    vi.restoreAllMocks()
  })
}

export function signInAs(email: string): Promise<User> {
  return authService.signIn({ email, password: MOCK_USER_PASSWORD })
}

// Back to the seeded state of 07 §4, for tests that mutate.
export function resetData(): void {
  database.reset()
}

export function shipmentIdOf(reference: string): string {
  const row = database.shipments.all().find((shipment) => shipment.reference === reference)
  if (!row) throw new Error(`No shipment ${reference}`)
  return row.id
}
