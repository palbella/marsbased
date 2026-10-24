import { aiHandlers } from './ai.handlers'
import { alertsHandlers } from './alerts.handlers'
import { authHandlers } from './auth.handlers'
import { documentsHandlers } from './documents.handlers'
import { exceptionsHandlers } from './exceptions.handlers'
import { healthHandlers } from './health.handlers'
import { mappingsHandlers } from './mappings.handlers'
import { referenceHandlers } from './reference.handlers'
import { shipmentsHandlers } from './shipments.handlers'
import { simulatorHandlers } from './simulator.handlers'

// 02 §5.2: one file per resource.
export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...shipmentsHandlers,
  ...exceptionsHandlers,
  ...alertsHandlers,
  ...documentsHandlers,
  ...aiHandlers,
  ...mappingsHandlers,
  ...referenceHandlers,
  ...simulatorHandlers,
]
