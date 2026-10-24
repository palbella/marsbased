import { z } from 'zod'
import { isoDateTimeSchema } from './primitives'

// 07 §6.
export const scenarioIdSchema = z.enum(['SIM-01', 'SIM-02', 'SIM-03', 'SIM-04', 'SIM-05'])
export type ScenarioId = z.infer<typeof scenarioIdSchema>

export const scenarioSchema = z.object({
  id: scenarioIdSchema,
  name: z.string().min(1),
  shipmentReference: z.string().min(1),
  description: z.string().min(1),
  // OP-51: a scenario runs once until the next reset.
  done: z.boolean(),
})
export type Scenario = z.infer<typeof scenarioSchema>

export const scenarioListSchema = z.array(scenarioSchema)

// BR-TM-01: real time plus an offset the simulator advances.
export const simulationClockSchema = z.object({
  now: isoDateTimeSchema,
  offsetHours: z.number().nonnegative(),
})
export type SimulationClock = z.infer<typeof simulationClockSchema>

// POST /api/simulator/clock (OP-52): the clock only moves forward.
export const advanceClockRequestSchema = z.object({ hours: z.number().positive() })
export type AdvanceClockRequest = z.infer<typeof advanceClockRequestSchema>
