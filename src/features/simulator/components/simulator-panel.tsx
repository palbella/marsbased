'use client'

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ClockControl } from './clock-control'
import { NetworkSelector } from './network-selector'
import { ResetControl } from './reset-control'
import { ScenarioList } from './scenario-list'

interface SimulatorPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// US-R-02, OP-50..55: the side panel the rail's Simulator item opens, for any role, so a
// reviewer can trigger events from either tab. The rail only offers it in non-production
// (OP-54). The monitoring log (OP-56) joins in T17.
export function SimulatorPanel({ open, onOpenChange }: SimulatorPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        closeLabel="Close simulator"
        className="w-full max-w-full overflow-y-auto bg-sheet text-ink md:w-[480px]"
      >
        <SheetTitle className="border-b border-rule px-4 py-4 pr-12 font-condensed text-lg font-semibold tracking-wide uppercase">
          Simulator
        </SheetTitle>
        {open && (
          <>
            <ClockControl />
            <ScenarioList />
            <NetworkSelector />
            <ResetControl />
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
