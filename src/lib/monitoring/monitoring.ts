import type { Role } from '@/domain'

export type MonitoringLevel = 'info' | 'warning' | 'error'

// 02 §5.8: the request behind an event, when there is one.
export interface RequestContext {
  method: string
  path: string
  status: number | null
  requestId: string | null
}

export interface MonitoringContext {
  tags?: Record<string, string>
  request?: RequestContext
}

export interface Breadcrumb {
  category: string
  message: string
  data?: Record<string, unknown>
}

// Id and role only: never name or e-mail (NFR-09, no PII).
export interface MonitoringUser {
  id: string
  role: Role
}

// 02 §5.8: one interface, so Phase 1 logs locally and Phase 2 sends the same calls to Sentry.
export interface Monitoring {
  captureException(error: unknown, context?: MonitoringContext): void
  captureMessage(message: string, level: MonitoringLevel, context?: MonitoringContext): void
  addBreadcrumb(breadcrumb: Breadcrumb): void
  setUser(user: MonitoringUser | null): void
}

// What every reported event carries (02 §5.8 "Context attached to every event").
export interface MonitoringEvent {
  at: string
  level: MonitoringLevel
  message: string
  errorName: string | null
  user: MonitoringUser | null
  route: string | null
  request: RequestContext | null
  tags: Record<string, string>
  // Breadcrumb data.
  data: Record<string, unknown>
  appVersion: string
}
