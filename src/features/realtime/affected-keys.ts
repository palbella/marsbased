import type { QueryKey } from '@tanstack/react-query'
import type { DomainEvent } from '@/domain'
import { queryKeys } from '@/services'

// BR-RT-02: the queries a thin event makes outdated; each key also covers the keys under it.
// null means everything (`data.reset`). Lists are always refetched: an event says which
// shipment changed, not which lists it belongs to, and the API decides what each user sees.
export function affectedKeys(event: DomainEvent): QueryKey[] | null {
  switch (event.type) {
    case 'shipment.updated':
      return [
        queryKeys.shipments.lists(),
        // Detail, timeline, raw events and activity.
        queryKeys.shipments.detail(event.shipmentId),
        queryKeys.ai.summary(event.shipmentId),
        queryKeys.ai.etaPrediction(event.shipmentId),
      ]
    case 'exception.changed':
      return [
        queryKeys.exceptions.lists(),
        queryKeys.exceptions.detail(event.exceptionId),
        queryKeys.ai.priority(event.exceptionId),
        // The open-exception count of the portfolio rows (OP-20) and the history (OP-10).
        queryKeys.shipments.lists(),
        queryKeys.shipments.activity(event.shipmentId),
      ]
    case 'alert.created':
      return [queryKeys.alerts.all()]
    case 'document.changed':
      return [
        queryKeys.documents.list(event.shipmentId),
        queryKeys.shipments.activity(event.shipmentId),
      ]
    case 'mapping.changed':
      return [queryKeys.mappings.all(), queryKeys.ai.mappingSuggestions()]
    case 'simulator.changed':
      return [
        queryKeys.simulator.clock(),
        queryKeys.simulator.scenarios(),
        queryKeys.simulator.network(),
      ]
    case 'data.reset':
      return null
  }
}
