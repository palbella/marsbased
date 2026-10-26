import { createClock, type Clock } from '@/mocks/clock'
import { replaySeed } from '@/mocks/engine/seed-replay'
import { pastActionsSeed } from './past-actions'
import { createTables, loadTables, TABLE_NAMES, type Tables } from './schema'
import { seedRows } from './seed'
import { hasSeedAged, readSnapshot, writeSnapshot } from './snapshot'
import type { SnapshotStorage } from './storage'
import type { SessionRow } from './tables/sessions'
import { SIMULATOR_ROW_ID, simulatorSeed } from './tables/simulator'

export type Database = Tables & {
  revision(): number
  // Reloads the shared snapshot if another tab wrote a newer revision, and reseeds it once
  // it has aged (SD-05).
  refresh(): void
  // Writes the snapshot with `revision + 1` if any table changed since the last load or write.
  persistIfChanged(): void
  // Reseeds every table except `sessions`, so nobody is signed out.
  reset(): void
}

// 02 §5.5: each tab holds its own copy; the snapshot in storage makes them one database.
// `realClock` has no simulation offset: it dates the seed for SD-05.
export function createDatabase(
  clock: Clock,
  storage: SnapshotStorage,
  realClock: Clock = createClock(() => 0),
): Database {
  const tables = createTables()
  let revision = 0
  let seededAt: number | undefined
  const persist = () => {
    revision += 1
    writeSnapshot(storage, { revision, seededAt, tables })
    for (const name of TABLE_NAMES) tables[name].markClean()
  }
  const reseed = () => {
    reseedKeepingSessions(tables, clock)
    seededAt = realClock.now().getTime()
    persist()
  }
  // Loads a newer snapshot. With no seed yet (a missing, corrupt or older-version snapshot)
  // or an aged one (SD-05), reseeds with a new revision, so every tab picks it up.
  const refresh = () => {
    const latest = readSnapshot(storage)
    if (latest && latest.revision > revision) {
      loadTables(tables, latest.tables)
      revision = latest.revision
      seededAt = latest.seededAt
    }
    if (hasSeedAged(seededAt, realClock.now().getTime())) reseed()
  }
  refresh()

  return {
    ...tables,
    revision: () => revision,
    refresh,
    persistIfChanged() {
      if (TABLE_NAMES.some((name) => tables[name].isDirty())) persist()
    },
    reset: reseed,
  }
}

function reseedKeepingSessions(tables: Tables, clock: Clock): void {
  const sessions = tables.sessions.all()
  // The clock may read its offset from this row, so the reseed starts from a fresh "now"
  // (07 §6 "Reset").
  tables.simulator.load(structuredClone(simulatorSeed))
  seed(tables, clock, sessions)
}

// SD-02, SD-03: the seeded facts, then the engine replays them up to now, so exceptions,
// alerts and activity look as if the system had been running.
function seed(tables: Tables, clock: Clock, sessions?: SessionRow[]): void {
  const rows = seedRows(clock)
  loadTables(tables, sessions ? { ...rows, sessions } : rows)
  replaySeed(tables, pastActionsSeed(clock), clock.now())
}

export function readClockOffsetHours(tables: Tables): number {
  return tables.simulator.findById(SIMULATOR_ROW_ID)?.clockOffsetHours ?? 0
}

// BR-TM-01: the clock offset lives in the simulator row, so every tab shares one clock.
export function createSharedDatabase(
  storage: SnapshotStorage,
  readRealTime?: () => number,
): { clock: Clock; database: Database } {
  // Before the database exists there is no row: a fresh seed starts at offset 0, as a reset does.
  let readOffsetHours = () => 0
  const clock = createClock(() => readOffsetHours(), readRealTime)
  const database = createDatabase(clock, storage, createClock(() => 0, readRealTime))
  readOffsetHours = () => readClockOffsetHours(database)
  return { clock, database }
}
