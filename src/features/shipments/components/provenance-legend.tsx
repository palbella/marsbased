'use client'

import { Info } from 'lucide-react'
import type { Provenance } from '@/domain'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AiTag, ProvenanceText, provenanceClasses } from './provenance-style'

// Fixed illustrations of each style, not data.
const EXAMPLE_CONFIDENCE = 0.68
const EXAMPLES: { provenance: Provenance; sample: string; meaning: string }[] = [
  {
    provenance: 'confirmed',
    sample: 'Thu 14 Nov 10:20',
    meaning: 'Confirmed: the operator reported it happened.',
  },
  {
    provenance: 'estimated',
    sample: 'Thu 14 Nov',
    meaning: 'Estimated: planned at booking, or estimated by the operator or by us.',
  },
  {
    provenance: 'predicted',
    sample: 'Fri 15 Nov',
    meaning: 'Predicted by AI, with its confidence. It never replaces the ETA.',
  },
]

// DS-05: the "How to read dates" popover, once in the header of each data page.
export function ProvenanceLegend() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="small">
          <Info aria-hidden strokeWidth={1.5} />
          How to read dates
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label="How to read dates">
        <p className="field-label">How to read dates</p>
        <dl className="mt-3 divide-y divide-rule border-y border-rule">
          {EXAMPLES.map(({ provenance, sample, meaning }) => (
            <div key={provenance} className="py-2.5">
              <dt className="flex items-baseline gap-2 text-sm">
                <span className={provenanceClasses[provenance]}>
                  <ProvenanceText provenance={provenance} text={sample} />
                </span>
                {provenance === 'predicted' && <AiTag confidence={EXAMPLE_CONFIDENCE} />}
              </dt>
              <dd className="mt-1 text-xs text-ink-muted">{meaning}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-ink-muted">
          Hover or focus a date to see its source. &ldquo;May be outdated&rdquo; means the operator
          has not reported for a long time.
        </p>
      </PopoverContent>
    </Popover>
  )
}
