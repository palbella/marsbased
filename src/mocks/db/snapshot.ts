import { TABLE_NAMES, type TableRows, type Tables } from './schema'
import type { SnapshotStorage } from './storage'

// 02 §5.5 "Persistence and multiple tabs". Bump the version when a table or row type
// changes, so tabs holding an older shape reseed instead of reading it.
export const SNAPSHOT_KEY = 'shipment-db:v1'
const SCHEMA_VERSION = 2

// SD-05: relative seed dates go stale, so a snapshot seeded longer ago than this reseeds.
export const SEED_MAX_AGE_HOURS = 6
const MS_PER_HOUR = 60 * 60 * 1000

export interface Snapshot {
  version: number
  revision: number
  // Real time (ms) of the last seed or reset. Snapshots written before SD-05 lack it.
  seededAt?: number
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

export function writeSnapshot(
  storage: SnapshotStorage,
  contents: { revision: number; seededAt: number | undefined; tables: Tables },
): void {
  // Each Table serialises as its rows (Table.toJSON).
  storage.write(SNAPSHOT_KEY, JSON.stringify({ version: SCHEMA_VERSION, ...contents }))
}

// SD-05: measured in real time, so advancing the simulation clock never triggers a reseed.
export function hasSeedAged(seededAt: number | undefined, realTime: number): boolean {
  return seededAt === undefined || realTime - seededAt > SEED_MAX_AGE_HOURS * MS_PER_HOUR
}

// Checks the envelope only: rows are written by this module, so their shape follows the
// schema version.
function isCurrentSnapshot(value: unknown): value is Snapshot {
  if (!isRecord(value)) return false
  const { version, revision, seededAt, tables } = value
  return (
    version === SCHEMA_VERSION &&
    typeof revision === 'number' &&
    (seededAt === undefined || typeof seededAt === 'number') &&
    isRecord(tables) &&
    TABLE_NAMES.every((name) => Array.isArray(tables[name]))
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
