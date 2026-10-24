import { createConsoleReporter } from './console-reporter'
import type { Monitoring, MonitoringEvent } from './monitoring'

export type {
  Breadcrumb,
  Monitoring,
  MonitoringContext,
  MonitoringEvent,
  MonitoringLevel,
  MonitoringUser,
  RequestContext,
} from './monitoring'

// 02 §5.7: `console` in Phase 1. The `sentry` reporter arrives with Phase 2 (§5.8 step 6);
// until then every value falls back to the console reporter.
const reporter = createConsoleReporter()

export const monitoring: Monitoring = reporter

// OP-56: the console reporter's ring buffer, newest last.
export function recentMonitoringEvents(): MonitoringEvent[] {
  return reporter.events()
}

export function clearMonitoringEvents(): void {
  reporter.clear()
}
