import { createClock } from '@/mocks/clock'
import { createTables, loadTables, type Tables } from '@/mocks/db/schema'
import { seedRows } from '@/mocks/db/seed'
import { shipmentEvents, type EventDraft } from '@/mocks/db/tables/raw-events/builders'
import { recompute } from './recompute'
import { NOW, at } from './test-fixtures'

// Shared by the engine tests that need tables: the seeded facts at NOW, before any replay,
// so each test drives the engine itself.
export const clock = createClock(
  () => 0,
  () => NOW.getTime(),
)

export function seededTables(): Tables {
  const tables = createTables()
  loadTables(tables, seedRows(clock))
  return tables
}

export const hoursLater = (hours: number) => new Date(at(hours))

let addedEvents = 0

// Inserts an operator event built with the seed builders (`eventBuilders(clock)`), then runs
// the engine as ingestion would (BR-EX-10).
export function ingest(db: Tables, shipmentId: string, draft: EventDraft, now = NOW) {
  const [row] = shipmentEvents(shipmentId, [draft])
  if (!row) throw new Error('No event built')
  addedEvents += 1
  db.rawEvents.insert({ ...row, id: `${row.id}_t${addedEvents}` })
  return recompute(db, shipmentId, now)
}

export function openExceptions(db: Tables, shipmentId: string) {
  return db.exceptions.where((row) => row.shipmentId === shipmentId && row.status !== 'resolved')
}

export function alertsOf(db: Tables, shipmentId: string) {
  return db.alerts.where((row) => row.shipmentId === shipmentId)
}
