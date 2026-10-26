import type { Alert, EtaImpact, EtaImpactDate, SourcedDate } from '@/domain'
import type { AlertRow, StoredEtaImpact } from '@/mocks/db/tables/alerts'

// Operator id → name; null for 'booking', 'system' and 'ai' sources.
export type OperatorNameOf = (source: string) => string | null

export function toAlertResponse(
  row: AlertRow,
  shipmentReference: string,
  operatorNameOf: OperatorNameOf,
): Alert {
  return {
    id: row.id,
    shipmentId: row.shipmentId,
    shipmentReference,
    type: row.type,
    title: row.title,
    message: row.message,
    etaImpact: row.etaImpact && toEtaImpact(row.etaImpact, operatorNameOf),
    requiresAction: row.requiresAction,
    createdAt: row.createdAt,
    readAt: row.readAt,
  }
}

// BR-AL-03, P1: each side names its operator, so the tooltip reads "Estimated by BlueWave".
function toEtaImpact(impact: StoredEtaImpact, operatorNameOf: OperatorNameOf): EtaImpact {
  const named = (date: SourcedDate | null): EtaImpactDate | null =>
    date && { ...date, operatorName: operatorNameOf(date.source) }
  return { previousEta: named(impact.previousEta), newEta: named(impact.newEta) }
}
