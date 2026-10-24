import type { ActivityEntry, ActivityType } from '@/domain'

export interface ActivityRow {
  id: string
  shipmentId: string
  exceptionId: string | null
  // null for entries made by the system (BR-EX-07).
  userId: string | null
  type: ActivityType
  payload: ActivityEntry['payload']
  at: string
}

// Filled by actions and automatic resolutions; past actions are replayed into it (SD-03).
export const activitySeed: ActivityRow[] = []
