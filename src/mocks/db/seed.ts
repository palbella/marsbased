import type { Clock } from '@/mocks/clock'
import type { TableRows } from './schema'
import { accountsSeed } from './tables/accounts'
import { activitySeed } from './tables/activity'
import { alertsSeed } from './tables/alerts'
import { documentsSeed } from './tables/documents'
import { exceptionsSeed } from './tables/exceptions'
import { legsSeed } from './tables/legs'
import { operatorsSeed } from './tables/operators'
import { rawEventsSeed } from './tables/raw-events'
import { sessionsSeed } from './tables/sessions'
import { shipmentEvaluationsSeed } from './tables/shipment-evaluations'
import { shipmentsSeed } from './tables/shipments'
import { simulatorSeed } from './tables/simulator'
import { sitesSeed } from './tables/sites'
import { statusMappingsSeed } from './tables/status-mappings'
import { userSitesSeed } from './tables/user-sites'
import { usersSeed } from './tables/users'

// 02 §5.5 rule 5: seeds are immutable, so every database gets its own deep copy.
export function seedRows(clock: Clock): TableRows {
  return structuredClone({
    users: usersSeed,
    sessions: sessionsSeed,
    userSites: userSitesSeed,
    accounts: accountsSeed,
    sites: sitesSeed,
    operators: operatorsSeed,
    shipments: shipmentsSeed(clock),
    legs: legsSeed(clock),
    rawEvents: rawEventsSeed(clock),
    statusMappings: statusMappingsSeed,
    exceptions: exceptionsSeed,
    activity: activitySeed,
    alerts: alertsSeed,
    documents: documentsSeed(clock),
    shipmentEvaluations: shipmentEvaluationsSeed,
    simulator: simulatorSeed,
  })
}
