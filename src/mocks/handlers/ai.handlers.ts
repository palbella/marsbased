import { http, HttpResponse } from 'msw'
import { draftMessage } from '@/mocks/ai/draft-message'
import { suggestMapping } from '@/mocks/ai/mapping-suggestion'
import { predictEtaInsight } from '@/mocks/ai/predicted-eta'
import { explainPriority } from '@/mocks/ai/priority-rationale'
import { summarise } from '@/mocks/ai/summary'
import {
  findExceptionInPerimeter,
  findShipmentInPerimeter,
  findShipmentOfLeg,
  requireOps,
  requireUser,
} from '@/mocks/auth'
import { clock, database } from '@/mocks/db/instance'
import type { UserRow } from '@/mocks/db/tables/users'
import { noContent, notFound, param, withMockLatency } from '@/mocks/http'
import { parseRawEvent } from '@/mocks/operators/parse-event'
import { createShipmentLoader } from '@/mocks/queries/shipment-loader'

// AI-1..5. AI outputs inherit the perimeter of their shipment (BR-PM-01); summary and
// predicted ETA are for both roles, the rest ops only (BR-PM-03).
export const aiHandlers = [
  http.get(
    '*/api/ai/shipments/:id/summary',
    withMockLatency(({ request, params }) => {
      const { facts, view } = loadShipment(requireUser(database, request), param(params, 'id'))
      return HttpResponse.json(summarise(facts, view, clock.now()))
    }),
  ),

  // BR-ETA-06: 204 when there is nothing left to predict (delivered).
  http.get(
    '*/api/ai/shipments/:id/eta-prediction',
    withMockLatency(({ request, params }) => {
      const { facts, view } = loadShipment(requireUser(database, request), param(params, 'id'))
      const prediction = predictEtaInsight(facts, view, clock.now())
      return prediction ? HttpResponse.json(prediction) : noContent()
    }),
  ),

  http.get(
    '*/api/ai/exceptions/:id/priority',
    withMockLatency(({ request, params }) => {
      const { exception, facts, view, now } = loadException(request, param(params, 'id'))
      const activity = database.activity.where((entry) => entry.shipmentId === exception.shipmentId)
      return HttpResponse.json(explainPriority(exception, facts, view, activity, now))
    }),
  ),

  // A POST because a draft is generated on request; it changes nothing (BR-AI-03, P3).
  http.post(
    '*/api/ai/exceptions/:id/draft-message',
    withMockLatency(({ request, params }) => {
      const { exception, facts, view, now } = loadException(request, param(params, 'id'))
      return HttpResponse.json(draftMessage(exception, facts, view, now))
    }),
  ),

  http.get(
    '*/api/ai/raw-events/:id/mapping-suggestion',
    withMockLatency(({ request, params }) => {
      const user = requireUser(database, request)
      requireOps(user)
      const rawEvent = database.rawEvents.findById(param(params, 'id'))
      if (!rawEvent) return notFound()
      findShipmentOfLeg(database, user, rawEvent.legId)
      const format = database.operators.findById(rawEvent.operatorId)?.format
      const parsed = format && parseRawEvent(rawEvent, format)
      if (!parsed) return notFound()
      return HttpResponse.json(
        suggestMapping({ rawEventId: rawEvent.id, label: parsed.label }, clock.now()),
      )
    }),
  ),
]

function loadShipment(user: UserRow, shipmentId: string) {
  const shipment = findShipmentInPerimeter(database, user, shipmentId)
  return createShipmentLoader(database, clock.now())(shipment.id)
}

function loadException(request: Request, exceptionId: string) {
  const user = requireUser(database, request)
  requireOps(user)
  const exception = findExceptionInPerimeter(database, user, exceptionId)
  const now = clock.now()
  return { exception, ...createShipmentLoader(database, now)(exception.shipmentId), now }
}
