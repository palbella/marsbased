import { useQuery } from '@tanstack/react-query'
import { aiService, documentsService, queryKeys, shipmentsService } from '@/services'

// TEMPORARY (T07, removed in T12): what the gallery loads per shipment, through services.
export function useSpecimenData(shipmentId: string) {
  const timeline = useQuery({
    queryKey: queryKeys.shipments.timeline(shipmentId),
    queryFn: ({ signal }) => shipmentsService.getTimeline(shipmentId, { signal }),
  })
  const rawEvents = useQuery({
    queryKey: queryKeys.shipments.rawEvents(shipmentId),
    queryFn: ({ signal }) => shipmentsService.getRawEvents(shipmentId, { signal }),
  })
  const documents = useQuery({
    queryKey: queryKeys.documents.list(shipmentId),
    queryFn: ({ signal }) => documentsService.list(shipmentId, { signal }),
  })
  const summary = useQuery({
    queryKey: queryKeys.ai.summary(shipmentId),
    queryFn: ({ signal }) => aiService.getSummary(shipmentId, { signal }),
  })
  const prediction = useQuery({
    queryKey: queryKeys.ai.etaPrediction(shipmentId),
    queryFn: ({ signal }) => aiService.getEtaPrediction(shipmentId, { signal }),
  })
  return { timeline, rawEvents, documents, summary, prediction }
}

export type SpecimenData = ReturnType<typeof useSpecimenData>

export async function downloadDocument(documentId: string) {
  const { blob, fileName } = await documentsService.download(documentId)
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: fileName ?? 'document.pdf',
  })
  link.click()
  URL.revokeObjectURL(url)
}
