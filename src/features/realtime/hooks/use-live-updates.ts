'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { realtimeClient } from '@/services'
import { affectedKeys } from '../affected-keys'

// US-R-01, BR-RT-02: views never poll; each thin event refetches what it affects, through the
// API, so the perimeter still applies. Mounted once per tab, in the shell.
export function useLiveUpdates(): void {
  const queryClient = useQueryClient()
  useEffect(
    () =>
      realtimeClient.subscribe((event) => {
        const keys = affectedKeys(event)
        if (keys === null) {
          void queryClient.invalidateQueries()
          return
        }
        for (const queryKey of keys) void queryClient.invalidateQueries({ queryKey })
      }),
    [queryClient],
  )
}
