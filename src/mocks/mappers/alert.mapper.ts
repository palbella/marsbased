import type { Alert } from '@/domain'
import type { AlertRow } from '@/mocks/db/tables/alerts'

export function toAlertResponse(row: AlertRow, shipmentReference: string): Alert {
  return {
    id: row.id,
    shipmentId: row.shipmentId,
    shipmentReference,
    type: row.type,
    title: row.title,
    message: row.message,
    etaImpact: row.etaImpact,
    requiresAction: row.requiresAction,
    createdAt: row.createdAt,
    readAt: row.readAt,
  }
}
