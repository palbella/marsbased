import type { Tables } from '@/mocks/db/schema'
import type { PastActionSeed } from '@/mocks/db/past-actions'
import type { DocumentRow } from '@/mocks/db/tables/documents'
import { applyExceptionAction } from './actions/apply-action'
import { isActive } from './exception-lifecycle'
import { recompute } from './recompute'
import { hoursBetween, MS_PER_HOUR } from './time'
import { bookingTime } from './timeline'

// SD-02: alerts older than this are created as read.
const ALERT_READ_AFTER_HOURS = 24

// SD-02, SD-03: rebuilds exceptions, alerts and activity as if the engine had been running.
// Facts arrive in time order (events on reception, documents on upload) and past actions
// apply at their time, each recomputing its own shipment. Hourly checkpoints recompute every
// booked shipment to catch time-based thresholds (staleness, customs windows, committed
// dates), so each `detectedAt` / `createdAt` is the checkpoint where its condition first held.
export function replaySeed(db: Tables, pastActions: PastActionSeed[], now: Date): void {
  const shipmentOfLeg = new Map(db.legs.all().map((leg) => [leg.id, leg.shipmentId]))
  const events = inTimeOrder(db.rawEvents.all(), (event) => event.receivedAt)
  const documents = db.documents.all()
  const uploads = inTimeOrder(documents, (document) => document.uploadedAt)
  const actions = inTimeOrder(pastActions, (action) => action.at)
  const bookings = bookingTimes(db)
  db.rawEvents.load([])
  db.documents.load(documents.map(beforeUpload))

  const hourly = hourlyCheckpoints([...events, ...uploads, ...actions], now)
  for (const at of checkpoints([...events, ...uploads, ...actions], hourly)) {
    const time = at.toISOString()
    const arrived = takeUntil(events, time).map(({ row }) => db.rawEvents.insert(row))
    const uploaded = takeUntil(uploads, time).map(({ row }) => db.documents.update(row.id, row))
    const due = takeUntil(actions, time).map(({ row }) => row)
    const touched = new Set([
      ...arrived.map((event) => shipmentOfLeg.get(event.legId)),
      ...uploaded.map((document) => document.shipmentId),
      ...due.map((action) => action.shipmentId),
    ])
    for (const [shipmentId, bookedAt] of bookings) {
      if (bookedAt <= time && (hourly.has(at.getTime()) || touched.has(shipmentId))) {
        recompute(db, shipmentId, at)
      }
    }
    for (const action of due) replayAction(db, action, at)
  }
  markOldAlertsRead(db, now)
}

interface Timed<Row> {
  time: string
  row: Row
}

// Rows with a time, oldest first; rows without one never arrive.
function inTimeOrder<Row>(rows: Row[], timeOf: (row: Row) => string | null): Timed<Row>[] {
  return rows
    .flatMap((row) => {
      const time = timeOf(row)
      return time === null ? [] : [{ time, row }]
    })
    .sort((a, b) => a.time.localeCompare(b.time))
}

// Removes and returns the queued rows due by `time`.
function takeUntil<Row>(queue: Timed<Row>[], time: string): Timed<Row>[] {
  const due = queue.findIndex((item) => item.time > time)
  return queue.splice(0, due === -1 ? queue.length : due)
}

// An available document is pending until its upload time.
function beforeUpload(document: DocumentRow): DocumentRow {
  if (document.uploadedAt === null) return document
  return { ...document, status: 'pending', fileName: null, size: null, uploadedAt: null }
}

// Every hour back from now to the first fact.
function hourlyCheckpoints(facts: Timed<unknown>[], now: Date): Set<number> {
  const first = Math.min(now.getTime(), ...facts.map((fact) => Date.parse(fact.time)))
  const hours = Math.ceil(hoursBetween(new Date(first), now))
  return new Set(
    Array.from({ length: hours + 1 }, (_, index) => now.getTime() - index * MS_PER_HOUR),
  )
}

// The hourly checkpoints and every fact time, oldest first, never after now.
function checkpoints(facts: Timed<unknown>[], hourly: Set<number>): Date[] {
  const last = Math.max(...hourly)
  return [...new Set([...facts.map((fact) => Date.parse(fact.time)), ...hourly])]
    .filter((time) => time <= last)
    .sort((a, b) => a - b)
    .map((time) => new Date(time))
}

// A shipment exists from its booking (BR-ETA-04: 48 h before the first leg departs).
function bookingTimes(db: Tables): Map<string, string> {
  const bookings = new Map<string, string>()
  for (const shipment of db.shipments.all()) {
    const [first, ...later] = db.legs
      .where((leg) => leg.shipmentId === shipment.id)
      .sort((a, b) => a.sequence - b.sequence)
    if (first) bookings.set(shipment.id, bookingTime([first, ...later]))
  }
  return bookings
}

// SD-03: through the action rules, on the open exception of the seeded type.
function replayAction(db: Tables, action: PastActionSeed, at: Date): void {
  const exception = db.exceptions
    .where((row) => row.shipmentId === action.shipmentId && row.type === action.exceptionType)
    .find(isActive)
  const result = exception
    ? applyExceptionAction(db, {
        exceptionId: exception.id,
        userId: action.userId,
        request: action.action,
        now: at,
      })
    : null
  if (!result?.ok) {
    throw new Error(
      `Seed past action on ${action.shipmentId} (${action.exceptionType}) cannot be replayed`,
    )
  }
}

function markOldAlertsRead(db: Tables, now: Date): void {
  const readAt = now.toISOString()
  for (const alert of db.alerts.all()) {
    if (hoursBetween(alert.createdAt, now) > ALERT_READ_AFTER_HOURS)
      db.alerts.update(alert.id, { readAt })
  }
}
