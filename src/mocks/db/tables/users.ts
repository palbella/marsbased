import type { Role } from '@/domain'

// No password column: credentials belong to the identity provider (02 §5.4 "Auth").
export interface UserRow {
  id: string
  name: string
  email: string
  role: Role
  // Only for `customer`.
  accountId: string | null
}

// 07 §2, in the order of the sign-in test accounts hint (UI-07).
export const usersSeed: UserRow[] = [
  customer('usr_001', 'Laura Gómez', 'laura.gomez@albaretail.test', 'acc_001'),
  customer('usr_002', 'Jordi Serra', 'jordi.serra@nexo.test', 'acc_002'),
  customer('usr_003', 'Ana Ruiz', 'ana.ruiz@talleresruiz.test', 'acc_003'),
  customer('usr_004', 'Camille Durand', 'camille.durand@durand.test', 'acc_004'),
  customer('usr_005', 'Diego Hernández', 'diego.hernandez@corvane-mx.test', 'acc_005'),
  ops('usr_010', 'Marc Puig', 'marc.puig@corvane.test', 'ops_agent'),
  ops('usr_011', 'Núria Vidal', 'nuria.vidal@corvane.test', 'ops_agent'),
  ops('usr_020', 'Elena Martín', 'elena.martin@corvane.test', 'ops_manager'),
]

function customer(id: string, name: string, email: string, accountId: string): UserRow {
  return { id, name, email, role: 'customer', accountId }
}

function ops(id: string, name: string, email: string, role: Role): UserRow {
  return { id, name, email, role, accountId: null }
}
