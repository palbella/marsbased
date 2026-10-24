import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

// DS-10: a rubber stamp, uppercase condensed text in a box rotated −2°. The word carries
// the meaning; the tone only reinforces it (NFR-04).
const toneClasses = {
  ink: 'text-ink',
  ok: 'text-ok',
  late: 'text-late',
  unknown: 'text-unknown',
}

export type StampTone = keyof typeof toneClasses

interface StampProps {
  tone?: StampTone
  className?: string
}

export function Stamp({ tone = 'ink', className, children }: PropsWithChildren<StampProps>) {
  return (
    <span
      className={cn(
        'inline-block -rotate-2 border-2 border-current px-3 py-1.5 font-condensed text-xl leading-none font-bold tracking-widest uppercase',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
