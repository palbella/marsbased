'use client'

import { useEffect, useState } from 'react'
import { realtimeClient, type RealtimeStatus } from '@/services'

// DS-01, UI-03: whether live updates are reaching this tab.
export function useRealtimeStatus(): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>('disconnected')
  useEffect(() => realtimeClient.onStatusChange(setStatus), [])
  return status
}
