import { http, HttpResponse } from 'msw'
import { confirmMappingRequestSchema } from '@/domain'
import { inPerimeter, requireOps, requireUser } from '@/mocks/auth'
import { clock, database } from '@/mocks/db/instance'
import { confirmMapping } from '@/mocks/engine/mappings'
import { parseBody, validationFailed, withMockLatency } from '@/mocks/http'
import { toStatusMappingResponse, toUnmappedStatuses } from '@/mocks/mappers/mapping.mapper'
import { publishChanges } from '@/mocks/realtime/publish'

// US-O-05: operator configuration, ops only (BR-PM-03, BR-PM-05).
export const mappingsHandlers = [
  http.get(
    '*/api/mappings/unmapped',
    withMockLatency(({ request }) => {
      const user = requireUser(database, request)
      requireOps(user)
      return HttpResponse.json(toUnmappedStatuses(database, inPerimeter(database, user)))
    }),
  ),

  // BR-NM-03: confirming a mapping reprocesses every past event with that code.
  http.post(
    '*/api/mappings',
    withMockLatency(({ request, body }) => {
      const user = requireUser(database, request)
      requireOps(user)
      const mapping = parseBody(body, confirmMappingRequestSchema)
      if (!database.operators.findById(mapping.operatorId))
        return validationFailed('Unknown operator.')
      publishChanges(confirmMapping(database, mapping, clock.now()))
      const saved = database.statusMappings
        .where((row) => row.operatorId === mapping.operatorId)
        .find((row) => row.rawCode === mapping.rawCode)
      if (!saved) throw new Error('The confirmed mapping was not stored')
      return HttpResponse.json(toStatusMappingResponse(saved), { status: 201 })
    }),
  ),
]
