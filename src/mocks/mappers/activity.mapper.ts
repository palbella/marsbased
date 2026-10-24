import { activityEntrySchema, type ActivityEntry } from '@/domain'
import type { ActivityRow } from '@/mocks/db/tables/activity'
import type { UserRow } from '@/mocks/db/tables/users'

// The row keeps `type` and `payload` as separate columns; parsing pairs them back into the
// discriminated union. Rows are written by the action rules, so a failure here is a bug.
export function toActivityResponse(row: ActivityRow, user: UserRow | undefined): ActivityEntry {
  return activityEntrySchema.parse({
    id: row.id,
    shipmentId: row.shipmentId,
    exceptionId: row.exceptionId,
    userId: row.userId,
    userName: user?.name ?? null,
    type: row.type,
    payload: row.payload,
    at: row.at,
  })
}
