'use client'

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { Exception, ExceptionActionRequest } from '@/domain'
import { exceptionsService, queryKeys } from '@/services'

// OP-15: an action can change the exception, the shipment (status, documents, activity),
// the customer's alerts and the AI notes; the queue and the rail counter read the
// exceptions root. No automatic retries: mutations never repeat a side effect (02 §5.6).
export function useExceptionAction(exception: Pick<Exception, 'id' | 'shipmentId'>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (action: ExceptionActionRequest) =>
      exceptionsService.runAction(exception.id, action),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.exceptions.detail(updated.id), updated)
      return invalidateAffected(queryClient, updated.shipmentId)
    },
  })
}

function invalidateAffected(queryClient: QueryClient, shipmentId: string): Promise<unknown> {
  const roots = [
    queryKeys.exceptions.all(),
    queryKeys.shipments.all(),
    queryKeys.documents.list(shipmentId),
    queryKeys.alerts.all(),
    queryKeys.ai.all(),
  ]
  return Promise.all(roots.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
}
