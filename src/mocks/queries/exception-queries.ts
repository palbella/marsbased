import type { Exception, ExceptionFilters, ExceptionStatusFilter } from '@/domain'
import type { Tables } from '@/mocks/db/schema'
import type { ExceptionRow } from '@/mocks/db/tables/exceptions'
import type { ShipmentRow } from '@/mocks/db/tables/shipments'
import { isActive } from '@/mocks/engine/exception-lifecycle'
import { comparePriority } from '@/mocks/engine/priority'
import { toExceptionResponse } from '@/mocks/mappers/exception.mapper'
import type { ShipmentLoader } from './shipment-loader'

const STATUS_MATCHES: Record<ExceptionStatusFilter, (row: ExceptionRow) => boolean> = {
  active: isActive,
  resolved: (row) => !isActive(row),
  all: () => true,
}

export function activeExceptionCount(db: Tables, shipmentId: string): number {
  return db.exceptions.where((row) => row.shipmentId === shipmentId && isActive(row)).length
}

export function toExceptionView(
  db: Tables,
  load: ShipmentLoader,
  row: ExceptionRow,
  now: Date,
): Exception {
  const activity = db.activity.where((entry) => entry.shipmentId === row.shipmentId)
  return toExceptionResponse(row, { shipment: load(row.shipmentId), activity, now })
}

// GET /api/exceptions (02 §5.2, OP-01, OP-04): `active` by default, sorted by BR-PR-02.
export function listExceptions(
  db: Tables,
  load: ShipmentLoader,
  shipments: ShipmentRow[],
  filters: ExceptionFilters,
  now: Date,
): Exception[] {
  const visible = new Map(shipments.map((shipment) => [shipment.id, shipment]))
  const matchesStatus = STATUS_MATCHES[filters.status ?? 'active']
  return (
    db.exceptions
      .where((row) => visible.has(row.shipmentId) && matchesStatus(row))
      .filter((row) => filters.type === undefined || row.type === filters.type)
      .filter((row) => filters.shipmentId === undefined || row.shipmentId === filters.shipmentId)
      .filter(
        (row) =>
          filters.site === undefined || visible.get(row.shipmentId)?.originSiteId === filters.site,
      )
      .map((row) => toExceptionView(db, load, row, now))
      // Operator and mode are the current leg's, as the queue row shows them (OP-02).
      .filter(
        (exception) => filters.operator === undefined || exception.operatorId === filters.operator,
      )
      .filter((exception) => filters.mode === undefined || exception.mode === filters.mode)
      .sort((a, b) =>
        comparePriority(
          { score: a.priorityScore, detectedAt: a.detectedAt },
          { score: b.priorityScore, detectedAt: b.detectedAt },
        ),
      )
  )
}
