import type {
  Breadcrumb,
  Monitoring,
  MonitoringContext,
  MonitoringEvent,
  MonitoringLevel,
  MonitoringUser,
} from './monitoring'

// 02 §5.8: the last events, viewable in the simulator panel (OP-56).
const RING_BUFFER_SIZE = 100
const LOG_PREFIX = '[monitoring]'
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev'

export interface ConsoleReporter extends Monitoring {
  // Newest last.
  events(): MonitoringEvent[]
  clear(): void
}

// Phase 1 reporter: structured console output plus an in-memory ring buffer.
export function createConsoleReporter(): ConsoleReporter {
  let events: MonitoringEvent[] = []
  let user: MonitoringUser | null = null

  const record = (event: MonitoringEvent) => {
    events = [...events, event].slice(-RING_BUFFER_SIZE)
    const log = event.level === 'error' ? console.error : console.info
    log(LOG_PREFIX, event)
  }

  return {
    captureException: (error, context) =>
      record(toEvent({ level: 'error', message: describe(error), error, user, context })),
    captureMessage: (message, level, context) => record(toEvent({ level, message, user, context })),
    addBreadcrumb: ({ category, message, data }: Breadcrumb) =>
      record(toEvent({ level: 'info', message: `${category}: ${message}`, user, data })),
    setUser: (next) => {
      user = next
    },
    events: () => [...events],
    clear: () => {
      events = []
    },
  }
}

interface EventInput {
  level: MonitoringLevel
  message: string
  user: MonitoringUser | null
  error?: unknown
  context?: MonitoringContext
  data?: Record<string, unknown>
}

function toEvent({ level, message, user, error, context = {}, data = {} }: EventInput) {
  const event: MonitoringEvent = {
    // Real time on purpose: monitoring reports when it happened, not the simulation clock.
    at: new Date().toISOString(),
    level,
    message,
    errorName: error instanceof Error ? error.name : null,
    user,
    route: typeof window === 'undefined' ? null : window.location.pathname,
    request: context.request ?? null,
    tags: context.tags ?? {},
    data,
    appVersion: APP_VERSION,
  }
  return event
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
