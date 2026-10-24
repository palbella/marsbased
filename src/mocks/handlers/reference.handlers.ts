import { http, HttpResponse } from 'msw'
import { requireOps, requireUser, shipmentsInPerimeter } from '@/mocks/auth'
import { database } from '@/mocks/db/instance'
import { withMockLatency } from '@/mocks/http'
import { toReferenceResponse } from '@/mocks/mappers/reference.mapper'

// US-O-01/02: filter options within the perimeter; ops only (BR-PM-03).
export const referenceHandlers = [
  http.get(
    '*/api/reference',
    withMockLatency(({ request }) => {
      const user = requireUser(database, request)
      requireOps(user)
      return HttpResponse.json(toReferenceResponse(database, shipmentsInPerimeter(database, user)))
    }),
  ),
]
