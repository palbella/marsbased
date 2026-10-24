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

  me: (options?: RequestOptions) => apiGet('/auth/me', userSchema, options),

  hasSession: (): boolean => tokenStore.get() !== null,
}
