import type { ExceptionStatus, ExceptionType, Severity, WaitingOn } from '@/domain'

export interface ExceptionRow {
  id: string
  shipmentId: string
  type: ExceptionType
  severity: Severity
  status: ExceptionStatus
  waitingOn: WaitingOn | null
  assigneeId: string | null
  detectedAt: string
  resolvedAt: string | null
  resolutionNote: string | null
}

// SD-02: never hand-written; the engine derives exceptions from the facts when seeding.
export const exceptionsSeed: ExceptionRow[] = []
