import { http, HttpResponse } from 'msw'
import { signInRequestSchema, type SignInResponse } from '@/domain'
import { requireUser, sessionToken, signIn } from '@/mocks/auth'
import { clock, database } from '@/mocks/db/instance'
import { noContent, parseBody, unauthorized, withMockLatency } from '@/mocks/http'
import { toUserResponse } from '@/mocks/mappers/user.mapper'

// US-00, 02 §5.4 "Auth".
export const authHandlers = [
  http.post(
    '*/api/auth/sign-in',
    withMockLatency(({ body }) => {
      const session = signIn(database, parseBody(body, signInRequestSchema), clock.now())
      if (!session) return unauthorized()
      const response: SignInResponse = {
        token: session.token,
        user: toUserResponse(database, session.user),
      }
      return HttpResponse.json(response)
    }),
  ),

  http.post(
    '*/api/auth/sign-out',
    withMockLatency(({ request }) => {
      requireUser(database, request)
      const token = sessionToken(request)
      if (token !== null) database.sessions.remove(token)
      return noContent()
    }),
  ),

  http.get(
    '*/api/auth/me',
    withMockLatency(({ request }) =>
      HttpResponse.json(toUserResponse(database, requireUser(database, request))),
    ),
  ),
]
