'use client'

import { useQuery } from '@tanstack/react-query'
import { perimeterLabel, roleLabels, type SignInRequest, type TestAccount } from '@/domain'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/loading-state'
import { queryKeys, simulatorService } from '@/services'

const SKELETON_ROWS = 3

interface TestAccountsProps {
  onUse(credentials: SignInRequest): void
}

// UI-07: the seeded users as a crew list, from the mock API, never hardcoded. Rendered only
// in non-production; a hint, so a failure hides it instead of getting in the way.
export function TestAccounts({ onUse }: TestAccountsProps) {
  const query = useQuery({
    queryKey: queryKeys.simulator.testAccounts(),
    queryFn: ({ signal }) => simulatorService.getTestAccounts({ signal }),
    staleTime: Infinity,
  })
  if (query.isError) return null

  return (
    <section aria-labelledby="test-accounts-title" className="mt-12 border-t-2 border-ink pt-3">
      <h2 id="test-accounts-title" className="field-label">
        Test accounts · Non-production
      </h2>
      {query.data ? (
        <>
          <ul className="mt-3 divide-y divide-rule border-y border-rule bg-sheet">
            {query.data.accounts.map((account) => (
              <CrewRow
                key={account.email}
                account={account}
                onUse={() => onUse({ email: account.email, password: query.data.password })}
              />
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-muted">
            Password for every account:{' '}
            <code className="font-mono text-sm text-ink">{query.data.password}</code>
          </p>
        </>
      ) : (
        <LoadingState rows={SKELETON_ROWS} label="Loading test accounts" className="px-0 py-3" />
      )}
    </section>
  )
}

function CrewRow({ account, onUse }: { account: TestAccount; onUse: () => void }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{account.name}</p>
        <p className="field-label">
          {roleLabels[account.role]} · {perimeterLabel(account.perimeter)}
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="small"
        onClick={onUse}
        aria-label={`Use ${account.name}`}
      >
        Use
      </Button>
    </li>
  )
}
