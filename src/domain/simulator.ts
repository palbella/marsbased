import { z } from 'zod'
import { userSchema } from './org'
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

// 02 §5.6, OP-55: failure modes of the mock API, applied to the current tab.
export const failureModeSchema = z.enum(['normal', 'slow', 'timeouts', 'flaky', 'down'])
export type FailureMode = z.infer<typeof failureModeSchema>

// GET / POST /api/simulator/network.
export const networkConditionsSchema = z.object({ mode: failureModeSchema })
export type NetworkConditions = z.infer<typeof networkConditionsSchema>

// POST /api/simulator/clock (OP-52): the clock only moves forward.
export const advanceClockRequestSchema = z.object({ hours: z.number().positive() })
export type AdvanceClockRequest = z.infer<typeof advanceClockRequestSchema>

// GET /api/simulator/test-accounts (UI-07, 02 §5.2): the shared password once, then the
// seeded users in the order of 07 §2, with the same perimeter as `GET /api/auth/me`.
export const testAccountSchema = userSchema.pick({
  name: true,
  email: true,
  role: true,
  perimeter: true,
})
export type TestAccount = z.infer<typeof testAccountSchema>

export const testAccountsSchema = z.object({
  password: z.string().min(1),
  accounts: z.array(testAccountSchema),
})
export type TestAccounts = z.infer<typeof testAccountsSchema>
