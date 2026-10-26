import type { Role } from '@/domain'

// UI-05: the rail per role, declared as data. The Simulator item (non-production) is not a
// route: the rail adds it as a button that opens the side panel.
export type CounterId = 'unreadAlerts' | 'activeExceptions'

export interface NavItem {
  label: string
  href: string
  // `label` completes the number for screen readers, e.g. "7 active".
  counter?: { id: CounterId; label: string }
}

const customerNavigation: NavItem[] = [
  // US-C-01
  { label: 'Arrivals', href: '/portal' },
  // US-C-04
  { label: 'Alerts', href: '/portal/alerts', counter: { id: 'unreadAlerts', label: 'unread' } },
]

const opsNavigation: NavItem[] = [
  // US-O-01: active = open + acknowledged.
  { label: 'Attention', href: '/ops', counter: { id: 'activeExceptions', label: 'active' } },
  // US-O-02
  { label: 'Shipments', href: '/ops/shipments' },
  // US-O-05 Mappings ships with its page in T15 (03 UI-05).
]

export const navigation: Record<Role, NavItem[]> = {
  customer: customerNavigation,
  ops_agent: opsNavigation,
  ops_manager: opsNavigation,
}

// UI-05: the item whose route is the longest prefix of the path, so `/ops/shipments/123`
// marks Shipments and not Attention.
export function activeHref(items: NavItem[], pathname: string): string | null {
  const matches = items
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
  if (matches.length === 0) return null
  return matches.reduce((longest, href) => (href.length > longest.length ? href : longest))
}

export function hasCounter(items: NavItem[], id: CounterId): boolean {
  return items.some((item) => item.counter?.id === id)
}
