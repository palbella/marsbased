'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useResetData } from '../hooks/use-simulator'

// OP-53: reset asks first; every open tab then reloads its data (`data.reset`), and nobody is
// signed out.
export function ResetControl() {
  const [confirming, setConfirming] = useState(false)
  const reset = useResetData()
  const confirm = () => reset.mutate(undefined, { onSuccess: () => setConfirming(false) })
  return (
    <div className="flex justify-end border-t border-rule px-4 py-4">
      <Button variant="secondary" onClick={() => setConfirming(true)}>
        Reset data
      </Button>
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogTitle>Reset data?</DialogTitle>
          <div className="space-y-4 px-4 py-4 text-sm">
            <p>
              Every shipment, exception, alert and document goes back to the seeded state, with a
              fresh &ldquo;now&rdquo;. Scenarios can run again. Nobody is signed out.
            </p>
            {reset.isError && (
              <p role="alert" className="text-late">
                The data could not be reset. Try again.
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2 border-t border-rule pt-4">
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button onClick={confirm} disabled={reset.isPending}>
                {reset.isPending ? 'Resetting…' : 'Reset data'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
