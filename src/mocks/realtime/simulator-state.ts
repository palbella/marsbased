import type { DomainEvent, ScenarioId, SimulationClock } from '@/domain'
import type { Clock } from '@/mocks/clock'
import type { Tables } from '@/mocks/db/schema'
import { SIMULATOR_ROW_ID, type SimulatorRow } from '@/mocks/db/tables/simulator'
import { recomputeAll } from '@/mocks/engine/recompute'

// The simulator's single row (02 §5.5): the clock offset and the scenarios run since reset.
function simulatorRow(db: Tables): SimulatorRow {
  const row = db.simulator.findById(SIMULATOR_ROW_ID)
  if (!row) throw new Error('The simulator row is missing')
  return row
}

// BR-TM-01: real time plus the shared offset.
export function simulationClock(db: Tables, clock: Clock): SimulationClock {
  return { now: clock.now().toISOString(), offsetHours: simulatorRow(db).clockOffsetHours }
}

// OP-52, BR-EX-10: the clock reads its offset from the row, so moving it moves `now` for
// every tab; then the engine runs for every shipment at the new time.
export function advanceClock(db: Tables, clock: Clock, hours: number): DomainEvent[] {
  const row = simulatorRow(db)
  db.simulator.update(row.id, { clockOffsetHours: row.clockOffsetHours + hours })
  return recomputeAll(db, clock.now())
}

// OP-51: a scenario runs once until the next reset.
export function hasRun(db: Tables, id: ScenarioId): boolean {
  return simulatorRow(db).scenariosRun.includes(id)
}

export function markRun(db: Tables, id: ScenarioId): void {
  const row = simulatorRow(db)
  db.simulator.update(row.id, { scenariosRun: [...row.scenariosRun, id] })
}
