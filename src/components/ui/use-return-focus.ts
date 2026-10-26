'use client'

import { useRef } from 'react'

type FocusHandler = (event: Event) => void

interface FocusHandlers {
  onOpenAutoFocus?: FocusHandler
  onCloseAutoFocus?: FocusHandler
}

// NFR-04: Radix returns the focus only to a `Trigger`. Dialogs and sheets opened from state
// (a row, the URL) have none, so they remember what had the focus when they opened and give
// it back on close, if it is still on the page.
export function useReturnFocus({ onOpenAutoFocus, onCloseAutoFocus }: FocusHandlers) {
  const opener = useRef<Element | null>(null)
  return {
    // Runs before Radix moves the focus into the content.
    onOpenAutoFocus: (event: Event) => {
      opener.current = document.activeElement
      onOpenAutoFocus?.(event)
    },
    onCloseAutoFocus: (event: Event) => {
      onCloseAutoFocus?.(event)
      const target = opener.current
      opener.current = null
      if (event.defaultPrevented || !(target instanceof HTMLElement)) return
      if (target === document.body || !target.isConnected) return
      event.preventDefault()
      target.focus()
    },
  }
}
