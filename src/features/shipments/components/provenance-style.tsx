import { confidencePercent, type Provenance } from '@/domain'
import { cn } from '@/lib/utils'

// DS-05: provenance is shown with type, not chips. The prefix and the style carry it; the
// screen-reader word repeats it without the symbol.
export const provenancePrefix: Record<Provenance, string> = {
  confirmed: '',
  estimated: '≈',
  predicted: '~',
}

export const provenanceClasses: Record<Provenance, string> = {
  confirmed: 'text-ink',
  estimated: 'text-ink-muted',
  predicted: 'italic text-predicted underline decoration-dotted underline-offset-4',
}

export const provenanceWords: Record<Provenance, string> = {
  confirmed: 'Confirmed',
  estimated: 'Estimated',
  predicted: 'Predicted',
}

interface ProvenanceTextProps {
  provenance: Provenance
  text: string
}

export function ProvenanceText({ provenance, text }: ProvenanceTextProps) {
  const prefix = provenancePrefix[provenance]
  return (
    <>
      {prefix && <span aria-hidden>{prefix} </span>}
      {provenance !== 'confirmed' && (
        <span className="sr-only">{provenanceWords[provenance]}: </span>
      )}
      {text}
    </>
  )
}

// DS-05: the `AI 68%` tag next to a predicted value.
export function AiTag({ confidence, className }: { confidence?: number; className?: string }) {
  const label = confidence === undefined ? 'AI' : `AI ${confidencePercent(confidence)}%`
  return (
    <span
      className={cn(
        'rounded-xs border border-predicted px-1 font-mono text-[11px] leading-4 text-predicted not-italic',
        className,
      )}
    >
      {label}
    </span>
  )
}
