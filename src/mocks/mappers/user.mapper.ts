import type { Perimeter, User } from '@/domain'
import { userSiteIds } from '@/mocks/auth'
import type { Tables } from '@/mocks/db/schema'
import type { UserRow } from '@/mocks/db/tables/users'

export function toUserResponse(db: Tables, user: UserRow): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    perimeter: perimeterOf(db, user),
  }
}

// BR-PM-01, resolved to names for the profile (UI-08).
function perimeterOf(db: Tables, user: UserRow): Perimeter {
  if (user.role === 'ops_manager') return { kind: 'all' }
  if (user.role === 'ops_agent') {
    const sites = userSiteIds(db, user).flatMap((id) => db.sites.findById(id) ?? [])
    return { kind: 'sites', sites: sites.map(({ id, name }) => ({ id, name })) }
  }
  const account = user.accountId === null ? undefined : db.accounts.findById(user.accountId)
  if (!account) throw new Error(`Customer ${user.id} has no account`)
  return { kind: 'account', account: { id: account.id, name: account.name, type: account.type } }
}
