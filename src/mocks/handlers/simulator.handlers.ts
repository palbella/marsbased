import { http, HttpResponse } from 'msw'
import { networkConditionsSchema, type NetworkConditions } from '@/domain'
import { requireUser } from '@/mocks/auth'
import { database } from '@/mocks/db/instance'
import { getFailureMode, setFailureMode } from '@/mocks/failure-mode'
import { parseBody, withMockLatency } from '@/mocks/http'

// US-R-02, OP-55: non-production only, for any signed-in role. The network endpoint is exempt
// from the failure mode, so the panel can always switch back to Normal (02 §5.6). Scenarios,
// clock and reset arrive with T11.
const exempt = { exemptFromFailureMode: true }

export const simulatorHandlers = [
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
      return HttpResponse.json(currentConditions())
    }, exempt),
  ),
]

function currentConditions(): NetworkConditions {
  return { mode: getFailureMode() }
}
