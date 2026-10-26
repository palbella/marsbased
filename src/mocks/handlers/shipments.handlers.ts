import { http, HttpResponse } from 'msw'
import { shipmentFiltersSchema } from '@/domain'
import {
  findShipmentInPerimeter,
  isOps,
  requireOps,
  requireUser,
  shipmentsInPerimeter,
} from '@/mocks/auth'
import { clock, database } from '@/mocks/db/instance'
import { compareActiveFirst } from '@/mocks/engine/on-time'
import { param, parseQuery, withMockLatency } from '@/mocks/http'
import { toActivityResponse } from '@/mocks/mappers/activity.mapper'
import { toRawEventResponse } from '@/mocks/mappers/raw-event.mapper'
import { toShipmentResponse } from '@/mocks/mappers/shipment.mapper'
import { toTimelineResponse } from '@/mocks/mappers/timeline.mapper'
import { activeExceptionCount } from '@/mocks/queries/exception-queries'
import { matchesShipmentFilters } from '@/mocks/queries/shipment-filters'
import { createShipmentLoader, type LoadedShipment } from '@/mocks/queries/shipment-loader'
import type { UserRow } from '@/mocks/db/tables/users'

// US-C-01/02, US-O-02/04. Read for both roles; raw events and activity are ops only (BR-PM-03).
export const shipmentsHandlers = [
  http.get(
    '*/api/shipments',
    withMockLatency(({ request }) => {
      const user = requireUser(database, request)
      const filters = parseQuery(request, shipmentFiltersSchema)
      const now = clock.now()
      const load = createShipmentLoader(database, now)
      const shipments = shipmentsInPerimeter(database, user)
        .map((row) => load(row.id))
        .filter((shipment) => matchesShipmentFilters(shipment, filters, now))
        // BR-OT-03 attention first; delivered last when both views are listed (OP-22).
        .sort((a, b) => compareActiveFirst(a.view, b.view))
      return HttpResponse.json(shipments.map((shipment) => respond(user, shipment)))
    }),
  ),

  http.get(
    '*/api/shipments/:id',
    withMockLatency(({ request, params }) => {
      const user = requireUser(database, request)
      const row = findShipmentInPerimeter(database, user, param(params, 'id'))
      return HttpResponse.json(respond(user, createShipmentLoader(database, clock.now())(row.id)))
    }),
  ),

  http.get(
    '*/api/shipments/:id/timeline',
    withMockLatency(({ request, params }) => {
      const user = requireUser(database, request)
      const row = findShipmentInPerimeter(database, user, param(params, 'id'))
      const { view } = createShipmentLoader(database, clock.now())(row.id)
      return HttpResponse.json(toTimelineResponse(view))
    }),
  ),

  http.get(
    '*/api/shipments/:id/raw-events',
    withMockLatency(({ request, params }) => {
      const user = requireUser(database, request)
      requireOps(user)
      const row = findShipmentInPerimeter(database, user, param(params, 'id'))
      const legIds = new Set(
        database.legs.where((leg) => leg.shipmentId === row.id).map((leg) => leg.id),
      )
      const mappings = database.statusMappings.all()
      const events = database.rawEvents
        .where((event) => legIds.has(event.legId))
        .flatMap((event) => {
          const operator = database.operators.findById(event.operatorId)
          return (operator && toRawEventResponse(event, operator, mappings)) ?? []
        })
        .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))
      return HttpResponse.json(events)
    }),
  ),

  http.get(
    '*/api/shipments/:id/activity',
    withMockLatency(({ request, params }) => {
      const user = requireUser(database, request)
      requireOps(user)
      const row = findShipmentInPerimeter(database, user, param(params, 'id'))
      const entries = database.activity
        .where((entry) => entry.shipmentId === row.id)
        .sort((a, b) => a.at.localeCompare(b.at))
        .map((entry) =>
          toActivityResponse(
            entry,
            entry.userId ? database.users.findById(entry.userId) : undefined,
          ),
        )
      return HttpResponse.json(entries)
    }),
  ),
]

// Customers never see exceptions, not even as a count (CP-16).
function respond(user: UserRow, shipment: LoadedShipment) {
  const count = isOps(user) ? activeExceptionCount(database, shipment.view.shipmentId) : undefined
  return toShipmentResponse(shipment, count)
}
