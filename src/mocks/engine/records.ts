import type { ActivityEntry, ActivityType } from '@/domain'
import type { Tables } from '@/mocks/db/schema'
import type { Table } from '@/mocks/db/table'
import type { ActivityRow } from '@/mocks/db/tables/activity'

const ID_DIGITS = 3

// 02 §5.5 rule 7: readable ids, prefixed per table (`exc_001`, `alr_012`).
export function nextId<Row extends { id: string }>(table: Table<Row>, prefix: string): string {
  const numbers = table
    .all()
    .map((row) => Number(row.id.slice(prefix.length + 1)))
    .filter((value) => Number.isInteger(value))
  const next = Math.max(0, ...numbers) + 1
  return `${prefix}_${String(next).padStart(ID_DIGITS, '0')}`
}

interface ActivityInput {
  shipmentId: string
  exceptionId: string | null
  // null for the engine's own entries (BR-EX-07).
  userId: string | null
  type: ActivityType
  payload: ActivityEntry['payload']
  at: string
}

export function recordActivity(db: Tables, entry: ActivityInput): ActivityRow {
  return db.activity.insert({ id: nextId(db.activity, 'act'), ...entry })
}
