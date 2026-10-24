import type { MappingTarget } from '@/domain'
import type { StatusMappingRow } from '@/mocks/db/tables/status-mappings'

// BR-NM-01: exact match on `(operatorId, code)`. null means unmapped (BR-NM-03).
export function findMappingTarget(
  mappings: StatusMappingRow[],
  operatorId: string,
  code: string,
): MappingTarget | null {
  const mapping = mappings.find((row) => row.operatorId === operatorId && row.rawCode === code)
  return mapping?.target ?? null
}
