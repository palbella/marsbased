import type { Role } from '@/domain'

// 03 §2: each role has one area; the profile is shared.
export const SIGN_IN_PATH = '/sign-in'
export const PROFILE_PATH = '/profile'

export type Area = 'portal' | 'ops'

const AREA_OF_ROLE: Record<Role, Area> = {
  customer: 'portal',
  ops_agent: 'ops',
  ops_manager: 'ops',
}

// Why the tab has no session, which decides where the guard sends it (UI-04, UI-09).
export type SignedOutReason = 'no-session' | 'signed-out' | 'expired'

export function areaOf(role: Role): Area {
  return AREA_OF_ROLE[role]
}

export function homeFor(role: Role): string {
  return `/${areaOf(role)}`
}

// UI-09: no session → come back here after signing in; signed out → plain sign-in;
// expired → sign-in with the expiry message.
export function signInPathFor(reason: SignedOutReason, currentPath: string): string {
  if (reason === 'expired') return `${SIGN_IN_PATH}?reason=expired`
  if (reason === 'signed-out') return SIGN_IN_PATH
  return `${SIGN_IN_PATH}?next=${encodeURIComponent(currentPath)}`
}

// UI-06: `next` is honoured only when it is a same-origin path under the role's area or the
// profile; anything else goes to the role's home.
export function resolveNextPath(next: string | null, role: Role): string {
  const home = homeFor(role)
  if (next === null || !isSameOriginPath(next)) return home
  const pathname = next.split(/[?#]/)[0] ?? ''
  const allowed = isUnder(pathname, home) || isUnder(pathname, PROFILE_PATH)
  return allowed ? next : home
}

// UI-06: no open redirects. Browsers read a backslash as a slash, so `/\host` is `//host`.
function isSameOriginPath(path: string): boolean {
  return (
    path.startsWith('/') && !path.startsWith('//') && !path.includes('://') && !path.includes('\\')
  )
}

function isUnder(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`)
}
