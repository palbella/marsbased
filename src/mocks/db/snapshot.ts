import { TABLE_NAMES, type TableRows, type Tables } from './schema'
import type { SnapshotStorage } from './storage'

// 02 §5.5 "Persistence and multiple tabs". Bump both when a row type changes, so tabs
// holding an older shape reseed instead of reading it.
export const SNAPSHOT_KEY = 'shipment-db:v1'
const SCHEMA_VERSION = 1

export interface Snapshot {
  version: number
  revision: number
  tables: TableRows
}

export function readSnapshot(storage: SnapshotStorage): Snapshot | null {
  const raw = storage.read(SNAPSHOT_KEY)
  if (raw === null) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isCurrentSnapshot(parsed) ? parsed : null
  } catch {
    // A corrupt snapshot is treated like a missing one: the database reseeds.
    return null
  }
}

export function writeSnapshot(storage: SnapshotStorage, revision: number, tables: Tables): void {
  // Each Table serialises as its rows (Table.toJSON).
  storage.write(SNAPSHOT_KEY, JSON.stringify({ version: SCHEMA_VERSION, revision, tables }))
}

// Checks the envelope only: rows are written by this module, so their shape follows the
// schema version.
function isCurrentSnapshot(value: unknown): value is Snapshot {
  if (!isRecord(value)) return false
  const { version, revision, tables } = value
  return (
    version === SCHEMA_VERSION &&
    typeof revision === 'number' &&
    isRecord(tables) &&
    TABLE_NAMES.every((name) => Array.isArray(tables[name]))
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
