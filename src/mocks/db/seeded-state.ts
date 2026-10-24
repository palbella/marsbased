import { createClock } from '@/mocks/clock'
import { loadShipmentFacts } from '@/mocks/engine/facts'
import { nextActions } from '@/mocks/engine/next-actions'
import { scorePriority } from '@/mocks/engine/priority'
import { deriveShipment } from '@/mocks/engine/shipment-view'
import { createDatabase } from './database'
import { createMemoryStorage } from './storage'

// Shared by the acceptance tests of 07 §4–5: one seeded database, read as the API will.
export const seededClock = createClock(
  () => 0,
  () => Date.parse('2026-11-10T08:00:00.000Z'),
)
export const seededDb = createDatabase(seededClock, createMemoryStorage())
export const seededNow = seededClock.now()

export const hoursFromSeededNow = (iso: string | null) =>
  iso === null ? null : (Date.parse(iso) - seededNow.getTime()) / 3_600_000

export function seededShipment(reference: string) {
  const row = seededDb.shipments.all().find((shipment) => shipment.reference === reference)
  const facts = row && loadShipmentFacts(seededDb, row.id)
  if (!row || !facts) throw new Error(`No shipment ${reference}`)
  const view = deriveShipment(facts, seededNow)
  const exceptions = seededDb.exceptions.where((exception) => exception.shipmentId === row.id)
  const open = exceptions
    .filter((exception) => exception.status !== 'resolved')
    .map((exception) => ({
      ...exception,
      nextActions: nextActions(exception, facts, view, seededDb.activity.all()),
      priority: scorePriority(exception, facts, view, seededDb.activity.all(), seededNow),
    }))
  const alerts = seededDb.alerts.where((alert) => alert.shipmentId === row.id)
  return { row, facts, view, exceptions, open, alerts }
}
