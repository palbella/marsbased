import type { Perimeter, Role } from '../org'

// Glossary names (01 §4), the same in the user menu, profile and test accounts.
export const roleLabels: Record<Role, string> = {
  customer: 'Customer',
  ops_agent: 'Ops agent',
  ops_manager: 'Ops manager',
}

// UI-08: account name for customers; sites, or "All sites" for managers.
export function perimeterLabel(perimeter: Perimeter): string {
  if (perimeter.kind === 'account') return perimeter.account.name
  if (perimeter.kind === 'all') return 'All sites'
  return perimeter.sites.map((site) => site.name).join(', ')
}

// UI-08: the field label above the perimeter in the profile.
export function perimeterFieldLabel(perimeter: Perimeter): string {
  return perimeter.kind === 'account' ? 'Account' : 'Sites'
}
