import type { DocumentStatus, DocumentType } from '@/domain'
import type { Clock } from '@/mocks/clock'

export interface DocumentRow {
  id: string
  shipmentId: string
  type: DocumentType
  status: DocumentStatus
  fileName: string | null
  size: number | null
  uploadedBy: string | null
  uploadedAt: string | null
}

// Downloads serve one generic sample PDF (07 §4 "Documents"), so every file has its size.
const SAMPLE_DOCUMENT_SIZE_BYTES = 184_320
const PENDING = 'pending'

// The seed has no booking date; the booking is taken to be two days before the pickup.
const BOOKING_BEFORE_PICKUP_HOURS = 48

// Hours from now when the document became available, or pending.
type DocumentPlan = Partial<Record<DocumentType, number | typeof PENDING>>

// 07 §4 "Documents", per BR-NA-03, each available from its milestone: CMR at `picked_up`
// (road shipments only), bill of lading at `vessel_departed`, customs declaration at
// `customs_submitted`, proof of delivery at `delivered`. Multimodal shipments carry no CMR.
export function documentsSeed(clock: Clock): DocumentRow[] {
  const shipment = (id: string, reference: string, plan: DocumentPlan) =>
    shipmentDocuments(clock, id, reference, plan)
  return [
    ...shipment('shp_001', 'SH-10401', { cmr: -5 }),
    ...shipment('shp_002', 'SH-10402', { cmr: -12 }),
    ...shipment('shp_003', 'SH-10403', { cmr: -34, proof_of_delivery: -24.5 }),
    ...shipment('shp_004', 'SH-10404', { cmr: -3 }),
    ...shipment('shp_005', 'SH-10405', { cmr: -57, proof_of_delivery: -47 }),
    ...shipment('shp_006', 'SH-10406', { cmr: -17 }),
    ...shipment('shp_007', 'SH-10407', { cmr: PENDING }),
    ...shipment('shp_008', 'SH-10408', { cmr: -6 }),
    ...shipment('shp_009', 'SH-10409', { cmr: -6 }),
    ...shipment('shp_010', 'SH-10411', { cmr: -7 }),
    ...shipment('shp_011', 'SH-10412', { cmr: -82, proof_of_delivery: -72.5 }),
    ...shipment('shp_012', 'SH-10421', { cmr: -13 }),
    ...shipment('shp_013', 'SH-10431', {
      bill_of_lading: PENDING,
      commercial_invoice: PENDING,
      packing_list: PENDING,
    }),
    ...shipment('shp_014', 'SH-10432', sea(-154, -120)),
    ...shipment('shp_015', 'SH-10433', sea(-226, -192)),
    ...shipment('shp_016', 'SH-10436', sea(-268, -240)),
    ...shipment('shp_017', 'SH-10438', { ...sea(-324, -296), commercial_invoice: PENDING }),
    ...shipment('shp_018', 'SH-10441', { ...sea(-394, -366), customs_declaration: PENDING }),
    ...shipment('shp_019', 'SH-10444', { ...sea(-443, -409), customs_declaration: -72 }),
    ...shipment('shp_020', 'SH-10447', { ...sea(-371, -343), customs_declaration: -6 }),
    ...shipment('shp_021', 'SH-10450', { ...sea(-407, -379), customs_declaration: -42 }),
    ...shipment('shp_022', 'SH-10452', {
      ...sea(-490, -456),
      customs_declaration: -119,
      proof_of_delivery: -73,
    }),
  ]
}

// Invoice and packing list exist from booking; the bill of lading from `vessel_departed`.
function sea(pickedUpHours: number, vesselDepartedHours: number): DocumentPlan {
  const booked = pickedUpHours - BOOKING_BEFORE_PICKUP_HOURS
  return {
    commercial_invoice: booked,
    packing_list: booked,
    bill_of_lading: vesselDepartedHours,
  }
}

function shipmentDocuments(
  clock: Clock,
  shipmentId: string,
  reference: string,
  plan: DocumentPlan,
): DocumentRow[] {
  const shipmentNumber = shipmentId.replace('shp_', '')
  return Object.entries(plan).map(([type, availableAt], index): DocumentRow => {
    const base = {
      id: `doc_${shipmentNumber}_${index + 1}`,
      shipmentId,
      // Object.entries widens the keys of DocumentPlan back to string.
      type: type as DocumentType,
      uploadedBy: null,
    }
    if (availableAt === PENDING || availableAt === undefined) {
      return { ...base, status: 'pending', fileName: null, size: null, uploadedAt: null }
    }
    return {
      ...base,
      status: 'available',
      fileName: `${reference}-${type.replaceAll('_', '-')}.pdf`,
      size: SAMPLE_DOCUMENT_SIZE_BYTES,
      uploadedAt: clock.hoursFromNow(availableAt),
    }
  })
}
