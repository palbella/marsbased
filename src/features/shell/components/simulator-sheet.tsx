'use client'

import { EmptyState } from '@/components/ui/empty-state'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

interface SimulatorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// UI-05, US-R-02: the rail's Simulator item opens this side panel. TEMPORARY placeholder:
// the panel itself (scenarios, clock, network mode) is built in T11.
export function SimulatorSheet({ open, onOpenChange }: SimulatorSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" closeLabel="Close simulator" className="bg-sheet text-ink">
        <SheetTitle className="border-b border-rule px-4 py-4 font-condensed text-lg font-semibold tracking-wide uppercase">
          Simulator
        </SheetTitle>
        <EmptyState stamp="NOT READY" message="Simulator controls are not available yet." />
      </SheetContent>
    </Sheet>
  )
}
