'use client'

import type { Role } from '@/domain'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { InkRail } from './ink-rail'

interface MobileDrawerProps {
  role: Role
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenSimulator: () => void
}

// UI-02: below 768 px the rail opens as a drawer; choosing an item closes it. Radix traps
// focus, closes on Esc and returns focus to the menu button.
export function MobileDrawer({ role, open, onOpenChange, onOpenSimulator }: MobileDrawerProps) {
  const close = () => onOpenChange(false)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        closeLabel="Close navigation"
        className="w-56 bg-ink pt-12 text-paper"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <InkRail
          role={role}
          onNavigate={close}
          onOpenSimulator={() => {
            close()
            onOpenSimulator()
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
