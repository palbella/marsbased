// ADR-009: sessions are per tab, so the token lives in `sessionStorage`; in memory in Node.
// Only `api-client.ts` and the auth service touch it (02 §8).
const TOKEN_KEY = 'session-token'

export interface TokenStore {
  get(): string | null
  set(token: string): void
  clear(): void
}

function createSessionTokenStore(): TokenStore {
  return {
    get: () => sessionStorage.getItem(TOKEN_KEY),
    set: (token) => sessionStorage.setItem(TOKEN_KEY, token),
    clear: () => sessionStorage.removeItem(TOKEN_KEY),
  }
}

function createMemoryTokenStore(): TokenStore {
  let token: string | null = null
  return {
    get: () => token,
    set: (next) => {
      token = next
    },
    clear: () => {
      token = null
    },
  }
}

export const tokenStore: TokenStore =
  typeof window === 'undefined' ? createMemoryTokenStore() : createSessionTokenStore()
