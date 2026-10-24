import { cn } from '@/lib/utils'

// SC-06, UI-10: a skeleton in the shape of the note while the AI output loads.
export function AnalystNoteSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn('border-l-2 border-predicted/40 bg-sheet py-3 pr-4 pl-4', className)}
    >
      <span className="sr-only">Loading AI note…</span>
      <div aria-hidden className="space-y-2">
        <span className="block h-3 w-48 animate-pulse rounded-xs bg-rule" />
        <span className="block h-3 w-full max-w-md animate-pulse rounded-xs bg-rule" />
        <span className="block h-3 w-2/3 max-w-sm animate-pulse rounded-xs bg-rule" />
      </div>
    </div>
  )
}
