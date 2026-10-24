import type { MappingTarget } from '@/domain'

export interface StatusMappingRow {
  id: string
  operatorId: string
  rawCode: string
  target: MappingTarget
}

type MappingEntry = [operatorId: string, rawCode: string, target: MappingTarget]

// 07 §3. EuroRoad's `RET-PLAT` is left unmapped on purpose (US-O-05).
const MAPPINGS: MappingEntry[] = [
  ['op_tir', '100', 'picked_up'],
  ['op_tir', '200', 'departed_site'],
  ['op_tir', '300', 'arrived_port'],
  ['op_tir', '400', 'out_for_delivery'],
  ['op_tir', '500', 'delivered'],
  ['op_tir', '700', 'eta_update'],
  ['op_tir', '900', 'position_update'],
  ['op_eur', 'PU', 'picked_up'],
  ['op_eur', 'DP', 'departed_site'],
  ['op_eur', 'OFD', 'out_for_delivery'],
  ['op_eur', 'POD', 'delivered'],
  ['op_eur', 'PING', 'position_update'],
  ['op_eur', 'NEWETA', 'eta_update'],
  ['op_pld', 'PICKUP', 'picked_up'],
  ['op_pld', 'DEPART', 'departed_site'],
  ['op_pld', 'GATE_IN', 'arrived_port'],
  ['op_bws', 'LOAD', 'loaded_on_vessel'],
  ['op_bws', 'VD', 'vessel_departed'],
  ['op_bws', 'VA', 'vessel_arrived'],
  ['op_bws', 'DISC', 'discharged'],
  ['op_bws', 'ETA', 'eta_update'],
  ['op_bws', 'CSUB', 'customs_submitted'],
  ['op_bws', 'CHLD', 'customs_hold'],
  ['op_bws', 'CREL', 'customs_cleared'],
  ['op_bws', 'POS', 'position_update'],
  ['op_lmx', 'Collected at port', 'picked_up'],
  ['op_lmx', 'On delivery route', 'out_for_delivery'],
  ['op_lmx', 'Delivered', 'delivered'],
]

export const statusMappingsSeed: StatusMappingRow[] = MAPPINGS.map(
  ([operatorId, rawCode, target], index) => ({
    id: `map_${String(index + 1).padStart(3, '0')}`,
    operatorId,
    rawCode,
    target,
  }),
)
