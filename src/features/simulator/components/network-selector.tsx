'use client'

import { failureModeLabels, failureModeSchema, type FailureMode } from '@/domain'
import { cn } from '@/lib/utils'
import { useNetworkConditions, useSetNetwork } from '../hooks/use-simulator'
import { PanelSection } from './panel-section'

// OP-55, 02 §5.6: the failure modes of the mock API, for this tab only. Native radios keep the
// arrow-key navigation (NFR-04).
export function NetworkSelector() {
  const network = useNetworkConditions()
  const setNetwork = useSetNetwork()
  const current = setNetwork.isPending ? setNetwork.variables : network.data?.mode
  return (
    <PanelSection title="Network (this tab)">
      <fieldset className="flex flex-wrap gap-x-4 gap-y-2" disabled={network.isPending}>
        <legend className="sr-only">Network conditions</legend>
        {failureModeSchema.options.map((mode) => (
          <ModeOption
            key={mode}
            mode={mode}
            checked={current === mode}
            onSelect={() => setNetwork.mutate(mode)}
          />
        ))}
      </fieldset>
      {setNetwork.isError && (
        <p role="alert" className="text-xs text-late">
          The network mode could not be changed. Try again.
        </p>
      )}
    </PanelSection>
  )
}

interface ModeOptionProps {
  mode: FailureMode
  checked: boolean
  onSelect: () => void
}

function ModeOption({ mode, checked, onSelect }: ModeOptionProps) {
  return (
    <label className={cn('flex items-center gap-1.5 text-sm', checked && 'font-semibold')}>
      <input
        type="radio"
        name="network-mode"
        value={mode}
        checked={checked}
        onChange={onSelect}
        className="size-4 accent-ink"
      />
      {failureModeLabels[mode]}
    </label>
  )
}
