// 07 §4 "Every shipment has a tracking number per leg".
const TRACKING_PREFIX: Record<string, string> = {
  op_tir: 'TIR',
  op_eur: 'EUR',
  op_pld: 'PLD',
  op_bws: 'BWS-BL',
  op_lmx: 'LMX',
}

// `leg_015_2` is the second leg of `shp_015`.
export function legId(shipmentId: string, sequence: number): string {
  return `leg_${shipmentId.replace('shp_', '')}_${sequence}`
}

// `TIR-10401` for SH-10401.
export function trackingNumber(operatorId: string, reference: string): string {
  return `${TRACKING_PREFIX[operatorId] ?? operatorId}-${reference}`
}
