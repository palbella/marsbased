import type { AccountTier, AccountType } from '@/domain'

export interface AccountRow {
  id: string
  name: string
  type: AccountType
  country: string
  tier: AccountTier
}

// 07 §2.
export const accountsSeed: AccountRow[] = [
  { id: 'acc_001', name: 'Alba Retail S.L.', type: 'customer', country: 'ES', tier: 'key' },
  {
    id: 'acc_002',
    name: 'Nexo Construcciones S.A.',
    type: 'customer',
    country: 'ES',
    tier: 'standard',
  },
  { id: 'acc_003', name: 'Talleres Ruiz S.L.', type: 'customer', country: 'ES', tier: 'standard' },
  {
    id: 'acc_004',
    name: 'Durand Équipements SARL',
    type: 'customer',
    country: 'FR',
    tier: 'standard',
  },
  {
    id: 'acc_005',
    name: 'Corvane México S.A. de C.V.',
    type: 'subsidiary',
    country: 'MX',
    tier: 'key',
  },
]
