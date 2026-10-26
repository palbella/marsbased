'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { ShipmentFilters } from '@/domain'
import { queryKeys, shipmentsService } from '@/services'

// CP-01, CP-04: the list keeps showing the previous result while new filters load.
export function useShipments(filters: ShipmentFilters) {
  return useQuery({
    queryKey: queryKeys.shipments.list(filters),
    queryFn: ({ signal }) => shipmentsService.list(filters, { signal }),
    placeholderData: keepPreviousData,
  })
}

// CP-10.
export function useShipment(id: string) {
  return useQuery({
    queryKey: queryKeys.shipments.detail(id),
    queryFn: ({ signal }) => shipmentsService.getById(id, { signal }),
  })
}

export function useShipmentTimeline(id: string) {
  return useQuery({
    queryKey: queryKeys.shipments.timeline(id),
    queryFn: ({ signal }) => shipmentsService.getTimeline(id, { signal }),
  })
}

// OP-10 history, OP-30 Activity tab. Ops only (BR-PM-03).
export function useShipmentActivity(id: string) {
  return useQuery({
    queryKey: queryKeys.shipments.activity(id),
    queryFn: ({ signal }) => shipmentsService.getActivity(id, { signal }),
  })
}

// OP-30 Timeline tab: the operator messages as received. Ops only (BR-PM-03).
export function useShipmentRawEvents(id: string) {
  return useQuery({
    queryKey: queryKeys.shipments.rawEvents(id),
    queryFn: ({ signal }) => shipmentsService.getRawEvents(id, { signal }),
  })
}
