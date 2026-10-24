import { LoadingState } from '@/components/ui/loading-state'
import { Wordmark } from '@/components/ui/wordmark'

// UI-09: the shell's shape while the session resolves, with nothing role-specific in it.
export function ShellSkeleton() {
  return (
    <div className="grid h-dvh grid-rows-[3.5rem_minmax(0,1fr)] md:grid-cols-[14rem_minmax(0,1fr)]">
      <header className="col-span-full flex h-14 items-center border-b border-paper/15 bg-ink px-4 text-paper md:px-5">
        <Wordmark />
      </header>
      <aside aria-hidden className="hidden bg-ink md:block" />
      <main className="bg-paper">
        <LoadingState label="Loading your session" />
      </main>
    </div>
  )
}
