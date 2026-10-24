import { describe, expect, it, vi } from 'vitest'
import { MOCK_USER_PASSWORD } from '@/mocks/auth'
import { authService, onSessionExpired, simulatorService, UnauthorizedError } from '@/services'
import { tokenStore } from '@/services/token-store'
import { setupMockApi, signInAs, USERS } from './setup'

setupMockApi()

describe('UI-07 test accounts', () => {
  it('answers without a session: the shared password once and the users of 07 §2 in order', async () => {
    const { password, accounts } = await simulatorService.getTestAccounts()

    expect(password).toBe(MOCK_USER_PASSWORD)
    expect(accounts.map((account) => account.email)).toEqual(Object.values(USERS))
  })

  it('carries each perimeter resolved to names, like /auth/me', async () => {
    const { accounts } = await simulatorService.getTestAccounts()
    const marc = accounts.find((account) => account.email === USERS.marc)
    const elena = accounts.find((account) => account.email === USERS.elena)

    expect(marc?.perimeter).toEqual({
      kind: 'sites',
      sites: [
        { id: 'site_zgz', name: 'Zaragoza Plant' },
        { id: 'site_vlc', name: 'Valencia Warehouse' },
      ],
    })
    expect(elena?.perimeter).toEqual({ kind: 'all' })
  })
})

describe('UI-09 session expiry', () => {
  it('a 401 on a request that carried a token clears it and signals the expiry', async () => {
    const listener = vi.fn()
    const unsubscribe = onSessionExpired(listener)
    await signInAs(USERS.laura)
    tokenStore.set('tok_revoked')

    await expect(authService.me()).rejects.toBeInstanceOf(UnauthorizedError)
    expect(listener).toHaveBeenCalledOnce()
    expect(authService.hasSession()).toBe(false)
    unsubscribe()
  })

  it('a failed sign-in (no token sent) is not an expiry', async () => {
    const listener = vi.fn()
    const unsubscribe = onSessionExpired(listener)

    const signIn = authService.signIn({ email: USERS.laura, password: 'wrong' })
    await expect(signIn).rejects.toBeInstanceOf(UnauthorizedError)
    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })
})
