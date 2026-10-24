import type { ScenarioId } from '@/domain'

export interface SimulatorRow {
  id: string
  // BR-TM-01: stored here so every tab shares the same simulation clock.
  clockOffsetHours: number
  scenariosRun: ScenarioId[]
}

export const SIMULATOR_ROW_ID = 'sim_001'

export const simulatorSeed: SimulatorRow[] = [
  { id: SIMULATOR_ROW_ID, clockOffsetHours: 0, scenariosRun: [] },
]
