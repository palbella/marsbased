import { http, HttpResponse } from 'msw'
import { exceptionFiltersSchema } from '@/domain'
import {
  findExceptionInPerimeter,
  requireOps,
  requireUser,
  shipmentsInPerimeter,
} from '@/mocks/auth'
import { clock, database } from '@/mocks/db/instance'
import { applyExceptionAction } from '@/mocks/engine/actions/apply-action'
import {
  conflict,
  notFound,
  param,
  parseQuery,
  validationFailed,
  withMockLatency,
} from '@/mocks/http'
import { listExceptions, toExceptionView } from '@/mocks/queries/exception-queries'
import { createShipmentLoader } from '@/mocks/queries/shipment-loader'
import { publishChanges } from '@/mocks/realtime/publish'

// US-O-01/03. Exceptions and actions are ops only (BR-PM-03).
export const exceptionsHandlers = [
  http.get(
    '*/api/exceptions',
    withMockLatency(({ request }) => {
      const user = requireUser(database, request)
      requireOps(user)
      const filters = parseQuery(request, exceptionFiltersSchema)
      const now = clock.now()
      const load = createShipmentLoader(database, now)
      const shipments = shipmentsInPerimeter(database, user)
      return HttpResponse.json(listExceptions(database, load, shipments, filters, now))
    }),
  ),

  http.get(
    '*/api/exceptions/:id',
    withMockLatency(({ request, params }) => {
      const user = requireUser(database, request)
      requireOps(user)
      const row = findExceptionInPerimeter(database, user, param(params, 'id'))
      const now = clock.now()
      return HttpResponse.json(
        toExceptionView(database, createShipmentLoader(database, now), row, now),
      )
    }),
  ),

  // 04 §10: every action goes through one audited endpoint and lands in the activity log.
  http.post(
    '*/api/exceptions/:id/actions',
    withMockLatency(({ request, params, body }) => {
      const user = requireUser(database, request)
      requireOps(user)
      const row = findExceptionInPerimeter(database, user, param(params, 'id'))
      const now = clock.now()
      const result = applyExceptionAction(database, {
        exceptionId: row.id,
        userId: user.id,
        request: body,
        now,
      })
      // BR-AC-06.
      if (!result.ok) return actionRejected(result.status, result.message)
      publishChanges(result.changes)
      const load = createShipmentLoader(database, now)
      return HttpResponse.json(toExceptionView(database, load, result.exception, now))
    }),
  ),
]

function actionRejected(status: 404 | 409 | 422, message: string): Response {
  if (status === 409) return conflict(message)
  if (status === 422) return validationFailed(message)
  return notFound()
}
