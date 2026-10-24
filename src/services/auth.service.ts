import { signInResponseSchema, userSchema, type SignInRequest, type User } from '@/domain'
import { monitoring } from '@/lib/monitoring'
import { apiGet, apiPost, apiPostEmpty, type RequestOptions } from './api-client'
import { tokenStore } from './token-store'

// US-00.
export const authService = {
  signIn: async (credentials: SignInRequest): Promise<User> => {
    const { token, user } = await apiPost('/auth/sign-in', credentials, signInResponseSchema)
    tokenStore.set(token)
    monitoring.setUser({ id: user.id, role: user.role })
    monitoring.addBreadcrumb({ category: 'session', message: 'Signed in' })
    return user
  },

  // The tab's session ends even if the request fails: signing out must always work.
  signOut: async (): Promise<void> => {
    try {
      await apiPostEmpty('/auth/sign-out')
    } finally {
      tokenStore.clear()
      monitoring.setUser(null)
      monitoring.addBreadcrumb({ category: 'session', message: 'Signed out' })
    }
  },

  // Restores a tab's session (ADR-009). The monitoring user is set here, not in a React
  // effect, so render errors in the first commit already carry it (02 §5.8).
  me: async (options?: RequestOptions): Promise<User> => {
    const user = await apiGet('/auth/me', userSchema, options)
    monitoring.setUser({ id: user.id, role: user.role })
    return user
  },

  hasSession: (): boolean => tokenStore.get() !== null,
}
