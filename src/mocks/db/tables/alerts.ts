import type { AlertType, SourcedDate } from '@/domain'

// BR-AL-03: stored by operator id; the mapper adds the operator's name (02 §6.2).
export interface StoredEtaImpact {
  previousEta: SourcedDate | null
  newEta: SourcedDate | null
}

export interface AlertRow {
  id: string
  shipmentId: string
  accountId: string
  type: AlertType
  title: string
  message: string
  etaImpact: StoredEtaImpact | null
  requiresAction: boolean
  createdAt: string
  readAt: string | null
}

// SD-02: never hand-written; the engine derives alerts from the facts when seeding.
export const alertsSeed: AlertRow[] = []
