import type { AlertFilters, ExceptionFilters, ShipmentFilters } from '@/domain'

// Central TanStack Query keys. Each resource starts with its own root, so realtime events can
// invalidate a whole resource or one id (BR-RT-02).
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  shipments: {
    all: () => ['shipments'] as const,
    lists: () => ['shipments', 'list'] as const,
    list: (filters: ShipmentFilters) => ['shipments', 'list', filters] as const,
    detail: (id: string) => ['shipments', 'detail', id] as const,
    timeline: (id: string) => ['shipments', 'detail', id, 'timeline'] as const,
    rawEvents: (id: string) => ['shipments', 'detail', id, 'raw-events'] as const,
    activity: (id: string) => ['shipments', 'detail', id, 'activity'] as const,
  },
  exceptions: {
    all: () => ['exceptions'] as const,
    lists: () => ['exceptions', 'list'] as const,
    list: (filters: ExceptionFilters) => ['exceptions', 'list', filters] as const,
    detail: (id: string) => ['exceptions', 'detail', id] as const,
  },
  alerts: {
    all: () => ['alerts'] as const,
    list: (filters: AlertFilters) => ['alerts', 'list', filters] as const,
  },
  documents: {
    all: () => ['documents'] as const,
    list: (shipmentId: string) => ['documents', 'list', shipmentId] as const,
  },
  ai: {
    all: () => ['ai'] as const,
    summary: (shipmentId: string) => ['ai', 'summary', shipmentId] as const,
    etaPrediction: (shipmentId: string) => ['ai', 'eta-prediction', shipmentId] as const,
    priority: (exceptionId: string) => ['ai', 'priority', exceptionId] as const,
    mappingSuggestions: () => ['ai', 'mapping-suggestion'] as const,
    mappingSuggestion: (rawEventId: string) => ['ai', 'mapping-suggestion', rawEventId] as const,
  },
  mappings: {
    all: () => ['mappings'] as const,
    unmapped: () => ['mappings', 'unmapped'] as const,
  },
  reference: {
    all: () => ['reference'] as const,
  },
  simulator: {
    all: () => ['simulator'] as const,
    scenarios: () => ['simulator', 'scenarios'] as const,
    clock: () => ['simulator', 'clock'] as const,
    network: () => ['simulator', 'network'] as const,
    testAccounts: () => ['simulator', 'test-accounts'] as const,
  },
}
