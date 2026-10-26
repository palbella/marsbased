'use client'

import { CircleCheck } from 'lucide-react'
import type { Scenario } from '@/domain'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { useQueryFailure } from '@/components/ui/use-query-failure'
import { useRunScenario, useScenarios } from '../hooks/use-simulator'
import { PanelSection } from './panel-section'

// OP-50, OP-51: each scenario with its target shipment; one that has run is Done until reset.
export function ScenarioList() {
  const scenarios = useScenarios()
  const run = useRunScenario()
  const failure = useQueryFailure(scenarios)
  return (
    <PanelSection title="Scenarios">
      {!failure && scenarios.isPending && (
        <LoadingState label="Loading scenarios" rows={5} className="px-0 py-0 md:px-0" />
      )}
      {failure && (
        <ErrorState
          message="Scenarios could not be loaded."
          retrying={failure.retrying}
          onRetry={() => scenarios.refetch()}
        />
      )}
      {scenarios.data && (
        <ul aria-label="Scenarios" className="divide-y divide-rule border-y border-rule">
          {scenarios.data.map((scenario) => (
            <ScenarioRow
              key={scenario.id}
              scenario={scenario}
              running={run.isPending && run.variables === scenario.id}
              failed={run.isError && run.variables === scenario.id}
              onRun={() => run.mutate(scenario.id)}
            />
          ))}
        </ul>
      )}
    </PanelSection>
  )
}

interface ScenarioRowProps {
  scenario: Scenario
  running: boolean
  failed: boolean
  onRun: () => void
}

function ScenarioRow({ scenario, running, failed, onRun }: ScenarioRowProps) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-mono text-xs text-ink-muted">{scenario.id}</span>
          <span className="font-medium">{scenario.name}</span>
          <span className="font-mono text-xs">{scenario.shipmentReference}</span>
        </p>
        <p className="text-xs text-ink-muted">{scenario.description}</p>
        {failed && (
          <p role="alert" className="text-xs text-late">
            The scenario could not run. Try again.
          </p>
        )}
      </div>
      {scenario.done ? (
        <span className="inline-flex h-8 items-center gap-1 font-condensed text-xs font-semibold tracking-wider uppercase">
          <CircleCheck aria-hidden className="size-4 text-ok" strokeWidth={1.5} />
          Done
        </span>
      ) : (
        <Button
          size="small"
          variant="secondary"
          disabled={running}
          onClick={onRun}
          aria-label={`Run ${scenario.id} ${scenario.name}`}
        >
          {running ? 'Running…' : 'Run'}
        </Button>
      )}
    </li>
  )
}
