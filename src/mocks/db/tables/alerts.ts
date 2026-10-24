import type { AlertType, EtaImpact } from '@/domain'

export interface AlertRow {
  id: string
  shipmentId: string
  accountId: string
  type: AlertType
  title: string
  message: string
  etaImpact: EtaImpact | null
  requiresAction: boolean
  createdAt: string
  readAt: string | null
}

// SD-02: never hand-written; the engine derives alerts from the facts when seeding.
export const alertsSeed: AlertRow[] = []
