import type { Mode, OperatorFormat } from '@/domain'

// BR-AI-05: historical ratio of actual to planned duration, per vessel for sea legs;
// `vessel: null` is the operator's default.
export interface DelayFactor {
  vessel: string | null
  factor: number
}

export interface OperatorRow {
  id: string
  name: string
  mode: Mode
  // Selects the operator's parser (BR-NM-01).
  format: OperatorFormat
  delayFactors: DelayFactor[]
}

// 07 §3.
export const operatorsSeed: OperatorRow[] = [
  operator('op_tir', 'Trans-Iberia Road', 'road', 'tir-json', [{ vessel: null, factor: 1.05 }]),
  operator('op_eur', 'EuroRoad Freight', 'road', 'eur-csv', [{ vessel: null, factor: 1.1 }]),
  operator('op_pld', 'PortLink Drayage', 'road', 'pld-json', [{ vessel: null, factor: 1.05 }]),
  operator('op_bws', 'BlueWave Shipping Line', 'sea', 'bws-edi', [
    { vessel: 'BW Aurora', factor: 1.02 },
    { vessel: 'BW Meridian', factor: 1.15 },
    // Vessels without history.
    { vessel: null, factor: 1.05 },
  ]),
  operator('op_lmx', 'LastMile Express MX', 'road', 'lmx-text', [{ vessel: null, factor: 1.2 }]),
]

function operator(
  id: string,
  name: string,
  mode: Mode,
  format: OperatorFormat,
  delayFactors: DelayFactor[],
): OperatorRow {
  return { id, name, mode, format, delayFactors }
}
