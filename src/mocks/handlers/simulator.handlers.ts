import { http, HttpResponse } from 'msw'
import {
  advanceClockRequestSchema,
  networkConditionsSchema,
  type NetworkConditions,
  type TestAccounts,
} from '@/domain'
import { MOCK_USER_PASSWORD, requireUser } from '@/mocks/auth'
import { clock, database } from '@/mocks/db/instance'
import { getFailureMode, setFailureMode } from '@/mocks/failure-mode'
import { conflict, noContent, notFound, param, parseBody, withMockLatency } from '@/mocks/http'
import { toUserResponse } from '@/mocks/mappers/user.mapper'
import { publishChanges } from '@/mocks/realtime/publish'
import { findScenario, listScenarios } from '@/mocks/realtime/scenarios'
import { advanceClock, hasRun, markRun, simulationClock } from '@/mocks/realtime/simulator-state'

// US-R-02, OP-50..55: non-production only, for any signed-in role. The network endpoint is
// exempt from the failure mode, so the panel can always switch back to Normal (02 §5.6).
// Every change publishes `simulator.changed` (BR-RT-01), so other tabs refresh the clock and
// the scenarios' Done state.
const exempt = { exemptFromFailureMode: true }
const SIMULATOR_CHANGED = { type: 'simulator.changed' } as const

export const simulatorHandlers = [
  http.get(
    '*/api/simulator/scenarios',
    withMockLatency(({ request }) => {
      requireUser(database, request)
      return HttpResponse.json(listScenarios(database))
    }),
  ),

  // OP-50, OP-51, 07 §6: a scenario runs once until the next reset.
  http.post(
    '*/api/simulator/scenarios/:id/run',
    withMockLatency(({ request, params }) => {
      requireUser(database, request)
      const scenario = findScenario(param(params, 'id'))
      if (!scenario) return notFound()
      if (hasRun(database, scenario.id)) return conflict('This scenario has already run.')
      const changes = scenario.run(database, clock)
      markRun(database, scenario.id)
      publishChanges([...changes, SIMULATOR_CHANGED])
      const ran = listScenarios(database).find((item) => item.id === scenario.id)
      return HttpResponse.json(ran)
    }),
  ),

  http.get(
    '*/api/simulator/clock',
    withMockLatency(({ request }) => {
      requireUser(database, request)
      return HttpResponse.json(simulationClock(database, clock))
    }),
  ),

  // OP-52, BR-EX-10: the engine runs for every shipment at the new time.
  http.post(
    '*/api/simulator/clock',
    withMockLatency(({ request, body }) => {
      requireUser(database, request)
      const { hours } = parseBody(body, advanceClockRequestSchema)
      publishChanges([...advanceClock(database, clock, hours), SIMULATOR_CHANGED])
      return HttpResponse.json(simulationClock(database, clock))
    }),
  ),

  // OP-53, 02 §5.5: reseeds everything but the sessions, so nobody is signed out.
  http.post(
    '*/api/simulator/reset',
    withMockLatency(({ request }) => {
      requireUser(database, request)
      database.reset()
      publishChanges([{ type: 'data.reset' }, SIMULATOR_CHANGED])
      return noContent()
    }),
  ),

  http.get(
    '*/api/simulator/network',
    withMockLatency(({ request }) => {
      requireUser(database, request)
      return HttpResponse.json(currentConditions())
    }, exempt),
  ),

  http.post(
    '*/api/simulator/network',
    withMockLatency(({ request, body }) => {
      requireUser(database, request)
      setFailureMode(parseBody(body, networkConditionsSchema).mode)
      publishChanges([SIMULATOR_CHANGED])
      return HttpResponse.json(currentConditions())
    }, exempt),
  ),

  // UI-07, 02 §5.2: the only endpoint without a session, because the sign-in page needs it.
  http.get(
    '*/api/simulator/test-accounts',
    withMockLatency(() => HttpResponse.json(testAccounts())),
  ),
]

function currentConditions(): NetworkConditions {
  return { mode: getFailureMode() }
}

function testAccounts(): TestAccounts {
  const accounts = database.users.all().map((user) => {
    const { name, email, role, perimeter } = toUserResponse(database, user)
    return { name, email, role, perimeter }
  })
  return { password: MOCK_USER_PASSWORD, accounts }
}
