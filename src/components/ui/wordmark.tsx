import { cn } from '@/lib/utils'

// Q-S1: Corvane Control Tower. `stacked` is the sign-in hero; `inline` the status strip,
// which keeps only "Corvane" on narrow screens so the strip fits 360 px (NFR-01).
interface WordmarkProps {
  layout?: 'inline' | 'stacked'
  className?: string
}

export function Wordmark({ layout = 'inline', className }: WordmarkProps) {
  if (layout === 'stacked') {
    return (
      <span
        className={cn(
          'flex flex-col gap-1 font-condensed text-4xl leading-none font-bold tracking-widest uppercase',
          className,
        )}
      >
        <span>Corvane</span>
        <span className="text-xl font-medium opacity-70">Control Tower</span>
      </span>
    )
  }
  return (
    <span
      className={cn(
        'flex items-baseline gap-1.5 font-condensed text-base font-bold tracking-widest uppercase',
        className,
      )}
    >
      <span>Corvane</span>
      <span aria-hidden className="hidden opacity-50 sm:inline">
        /
      </span>
      <span className="hidden text-sm font-medium opacity-70 sm:inline">Control Tower</span>
    </span>
  )
}
