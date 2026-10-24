import type { Tables } from './db/schema'
import type { ExceptionRow } from './db/tables/exceptions'
import type { ShipmentRow } from './db/tables/shipments'
import type { UserRow } from './db/tables/users'
import { forbidden, notFound, unauthorized } from './http'

// 07 §2: one non-production password for every seeded user. There is no password column:
// in Phase 2 credentials live in the identity provider (02 §5.4 "Auth").
export const MOCK_USER_PASSWORD = 'Tracking2026!'

const BEARER_PREFIX = 'Bearer '

export function signIn(
  db: Tables,
  credentials: { email: string; password: string },
  now: Date,
): { token: string; user: UserRow } | null {
  const email = credentials.email.trim().toLowerCase()
  const user = db.users.where((row) => row.email.toLowerCase() === email)[0]
  if (!user || credentials.password !== MOCK_USER_PASSWORD) return null
  // Opaque and random: it carries no user data.
  const token = `tok_${crypto.randomUUID()}`
  db.sessions.insert({ id: token, userId: user.id, createdAt: now.toISOString() })
  return { token, user }
}

export function sessionToken(request: Request): string | null {
  const header = request.headers.get('authorization')
  if (!header?.startsWith(BEARER_PREFIX)) return null
  return header.slice(BEARER_PREFIX.length)
}

// 02 §5.1 rule 3: the user always comes from the token, never from the caller. 401 otherwise.
export function requireUser(db: Tables, request: Request): UserRow {
  const token = sessionToken(request)
  const session = token === null ? undefined : db.sessions.findById(token)
  const user = session && db.users.findById(session.userId)
  if (!user) throw unauthorized()
  return user
}

export function isOps(user: UserRow): boolean {
  return user.role === 'ops_agent' || user.role === 'ops_manager'
}

// BR-PM-03: endpoints a role can never use answer 403.
export function requireOps(user: UserRow): void {
  if (!isOps(user)) throw forbidden()
}

export function requireCustomer(user: UserRow): void {
  if (user.role !== 'customer') throw forbidden()
}

// BR-PM-01: customer → own account; ops agent → origin site in their sites; manager → all.
export function inPerimeter(db: Tables, user: UserRow): (shipment: ShipmentRow) => boolean {
  if (user.role === 'ops_manager') return () => true
  if (user.role === 'customer') return (shipment) => shipment.accountId === user.accountId
  const siteIds = new Set(userSiteIds(db, user))
  return (shipment) => siteIds.has(shipment.originSiteId)
}

export function userSiteIds(db: Tables, user: UserRow): string[] {
  return db.userSites.where((row) => row.userId === user.id).map((row) => row.siteId)
}

export function shipmentsInPerimeter(db: Tables, user: UserRow): ShipmentRow[] {
  return db.shipments.where(inPerimeter(db, user))
}

// BR-PM-02: missing and out of perimeter answer the same 404.
export function findShipmentInPerimeter(db: Tables, user: UserRow, id: string): ShipmentRow {
  const shipment = db.shipments.findById(id)
  if (!shipment || !inPerimeter(db, user)(shipment)) throw notFound()
  return shipment
}

// BR-PM-01: an exception inherits the perimeter of its shipment.
export function findExceptionInPerimeter(db: Tables, user: UserRow, id: string): ExceptionRow {
  const exception = db.exceptions.findById(id)
  if (!exception) throw notFound()
  findShipmentInPerimeter(db, user, exception.shipmentId)
  return exception
}

// BR-PM-01: raw events inherit the perimeter of their shipment, through their leg.
export function findShipmentOfLeg(db: Tables, user: UserRow, legId: string): ShipmentRow {
  const leg = db.legs.findById(legId)
  if (!leg) throw notFound()
  return findShipmentInPerimeter(db, user, leg.shipmentId)
}
