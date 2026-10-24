import { http, HttpResponse } from 'msw'
import { alertFiltersSchema } from '@/domain'
import { requireCustomer, requireUser } from '@/mocks/auth'
import type { Tables } from '@/mocks/db/schema'
import { clock, database } from '@/mocks/db/instance'
import type { AlertRow } from '@/mocks/db/tables/alerts'
import type { UserRow } from '@/mocks/db/tables/users'
import { noContent, notFound, param, parseQuery, withMockLatency } from '@/mocks/http'
import { toAlertResponse } from '@/mocks/mappers/alert.mapper'

// US-C-04, BR-AL-*: customer only (BR-PM-03).
export const alertsHandlers = [
  http.get(
    '*/api/alerts',
    withMockLatency(({ request }) => {
      const user = requireAlertReader(request)
      const { shipmentId } = parseQuery(request, alertFiltersSchema)
      const alerts = alertsOf(database, user)
        .filter((alert) => shipmentId === undefined || alert.shipmentId === shipmentId)
        // CP-20: newest first.
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return HttpResponse.json(alerts.map((alert) => respond(database, alert)))
    }),
  ),

  http.post(
    '*/api/alerts/:id/read',
    withMockLatency(({ request, params }) => {
      const user = requireAlertReader(request)
      const alert = alertsOf(database, user).find((row) => row.id === param(params, 'id'))
      if (!alert) return notFound()
      const read = alert.readAt === null ? markRead(database, alert, clock.now()) : alert
      return HttpResponse.json(respond(database, read))
    }),
  ),

  // CP-22.
  http.post(
    '*/api/alerts/read-all',
    withMockLatency(({ request }) => {
      const user = requireAlertReader(request)
      const now = clock.now()
      for (const alert of alertsOf(database, user)) {
        if (alert.readAt === null) markRead(database, alert, now)
      }
      return noContent()
    }),
  ),
]

function requireAlertReader(request: Request): UserRow {
  const user = requireUser(database, request)
  requireCustomer(user)
  return user
}

// BR-PM-01: alerts inherit the perimeter of their shipment.
function alertsOf(db: Tables, user: UserRow): AlertRow[] {
  return db.alerts.where((alert) => {
    const shipment = db.shipments.findById(alert.shipmentId)
    return shipment?.accountId === user.accountId
  })
}

function markRead(db: Tables, alert: AlertRow, now: Date): AlertRow {
  return db.alerts.update(alert.id, { readAt: now.toISOString() })
}

function respond(db: Tables, alert: AlertRow) {
  return toAlertResponse(
    alert,
    db.shipments.findById(alert.shipmentId)?.reference ?? alert.shipmentId,
  )
}
