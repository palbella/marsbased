'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { Alert } from '@/domain'
import { Toast, ToastProvider } from '@/components/ui/toast'
import { newUnreadAlerts } from '../alert-groups'
import { useAlerts } from '../hooks/use-alerts'

// CP-31: a toast for each new unread alert, on any portal page. It compares each result of
// the shared alerts query with the previous one; the first result only sets the baseline,
// so signing in never floods the screen with old alerts.
export function NewAlertToaster() {
  const toasts = useNewAlerts()
  return (
    <ToastProvider>
      {toasts.current.map((alert) => (
        <Toast
          key={alert.id}
          title={alert.title}
          onOpenChange={(open) => !open && toasts.dismiss(alert.id)}
          actionAltText={`View shipment ${alert.shipmentReference}`}
          action={
            <Link
              href={`/portal/shipments/${alert.shipmentId}`}
              className="mt-1 inline-block text-sm font-semibold underline underline-offset-2"
            >
              View {alert.shipmentReference}
            </Link>
          }
        />
      ))}
    </ToastProvider>
  )
}

function useNewAlerts() {
  const { data } = useAlerts()
  const seenIds = useRef<Set<string> | null>(null)
  const [current, setCurrent] = useState<Alert[]>([])

  useEffect(() => {
    if (!data) return
    const fresh = seenIds.current ? newUnreadAlerts(seenIds.current, data) : []
    seenIds.current = new Set(data.map((alert) => alert.id))
    if (fresh.length > 0) setCurrent((shown) => [...shown, ...fresh])
  }, [data])

  const dismiss = (id: string) => setCurrent((shown) => shown.filter((alert) => alert.id !== id))
  return { current, dismiss }
}
