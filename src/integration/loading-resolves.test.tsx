// @vitest-environment jsdom
import '@/test/dom'
import { focusManager, QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FailureMode } from '@/domain'
import { parseArrivalFilters } from '@/features/arrivals/arrival-filters'
import { ArrivalsAgenda } from '@/features/arrivals/components/arrivals-agenda'
import { QueueList } from '@/features/exceptions/components/queue-list'
import { parseQueueFilters } from '@/features/exceptions/queue-filters'
import { PortfolioBoard } from '@/features/portfolio/components/portfolio-board'
import { parsePortfolioParams } from '@/features/portfolio/portfolio-params'
import { ShipmentDetail } from '@/features/shipment-detail'
import { getFailureMode, setFailureMode } from '@/mocks/failure-mode'
import { createQueryClient } from '@/services'
import { setupMockApi, shipmentIdOf, signInAs, SLOW_TEST_TIMEOUT_MS, USERS } from './setup'

setupMockApi()

// Shorter than the client's 10 s, so a Timeouts cycle (3 attempts, 1 s + 2 s of back-off)
// fails in about 4 s instead of 33 s.
const SHORT_TIMEOUT_MS = 200
const ERROR_WAIT_MS = 8_000
// Less than the first back-off: a hidden tab must not hold the error behind a retry.
const HIDDEN_ERROR_WAIT_MS = 900
const realTimeout = AbortSignal.timeout.bind(AbortSignal)

// Only under Timeouts: on Normal a request may take up to 400 ms (NFR-05).
beforeEach(() => {
  vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms) =>
    realTimeout(getFailureMode() === 'timeouts' ? SHORT_TIMEOUT_MS : ms),
  )
})

afterEach(() => {
  vi.mocked(AbortSignal.timeout).mockRestore()
  focusManager.setFocused(undefined)
})

const noop = () => undefined

interface ViewCase {
  name: string
  user: string
  element: () => ReactElement
  loaded: () => Promise<unknown>
}

const VIEWS: ViewCase[] = [
  {
    name: 'customer shipment detail',
    user: USERS.diego,
    element: () => <ShipmentDetail id={shipmentIdOf('SH-10441')} />,
    loaded: () => screen.findByRole('article', { name: 'Shipment SH-10441' }),
  },
  {
    name: 'arrivals',
    user: USERS.diego,
    element: () => (
      <ArrivalsAgenda filters={parseArrivalFilters(new URLSearchParams())} onClearFilters={noop} />
    ),
    loaded: () => screen.findAllByText('SH-10441'),
  },
  {
    name: 'attention queue',
    user: USERS.marc,
    element: () => (
      <QueueList
        filters={parseQueueFilters(new URLSearchParams())}
        onClearFilters={noop}
        onOpen={noop}
        onAction={noop}
      />
    ),
    loaded: () => screen.findByRole('list', { name: 'Attention queue' }),
  },
  {
    name: 'portfolio',
    user: USERS.marc,
    element: () => (
      <PortfolioBoard
        {...parsePortfolioParams(new URLSearchParams())}
        onSort={noop}
        onClearFilters={noop}
      />
    ),
    loaded: () => screen.findByRole('table'),
  },
]

const FAILING_MODES: FailureMode[] = ['timeouts', 'down']

function renderWith(client: QueryClient, element: ReactElement) {
  return render(<QueryClientProvider client={client}>{element}</QueryClientProvider>)
}

function findError(timeout = ERROR_WAIT_MS) {
  return screen.findByText('NO SIGNAL', undefined, { timeout })
}

async function renderFailedDetail(client: QueryClient) {
  await signInAs(USERS.diego)
  setFailureMode('timeouts')
  const view = renderWith(client, <ShipmentDetail id={shipmentIdOf('SH-10441')} />)
  await findError()
  return view
}

describe('NFR-08, 02 §5.6: every view reaches its error state and recovers', () => {
  const cases = VIEWS.flatMap((view) => FAILING_MODES.map((mode) => [view.name, mode, view] as const))

  it.each(cases)(
    '%s under %s shows NO SIGNAL, then loads on Normal + Retry',
    async (_name, mode, view) => {
      await signInAs(view.user)
      setFailureMode(mode)
      renderWith(createQueryClient(), view.element())
      await findError()
      setFailureMode('normal')
      await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
      await view.loaded()
    },
    SLOW_TEST_TIMEOUT_MS,
  )
})

describe('NFR-08, 02 §5.6: loading never stays on the skeleton', () => {
  it(
    'a failure while the tab is hidden shows the error instead of pausing the retries',
    async () => {
      await signInAs(USERS.diego)
      setFailureMode('timeouts')
      focusManager.setFocused(false)
      renderWith(createQueryClient(), <ShipmentDetail id={shipmentIdOf('SH-10441')} />)
      expect(await findError(SHORT_TIMEOUT_MS + HIDDEN_ERROR_WAIT_MS)).toBeTruthy()
    },
    SLOW_TEST_TIMEOUT_MS,
  )

  it(
    'a background refetch keeps the error visible, with a Retrying… hint',
    async () => {
      const client = createQueryClient()
      await renderFailedDetail(client)
      act(() => void client.invalidateQueries())
      // Whichever the refetch renders first: the hint, or the skeleton it must not go back to.
      await waitFor(() =>
        expect(
          screen.queryByText('Retrying…') ?? screen.queryByText('Loading shipment…'),
        ).not.toBeNull(),
      )
      expect(screen.queryByText('Loading shipment…')).toBeNull()
      expect(screen.getByText('NO SIGNAL')).toBeTruthy()
      expect(screen.getByText('Retrying…')).toBeTruthy()
    },
    SLOW_TEST_TIMEOUT_MS,
  )

  it(
    'remounting an errored block shows the error, not a new loading cycle',
    async () => {
      const client = createQueryClient()
      const view = await renderFailedDetail(client)
      view.unmount()
      renderWith(client, <ShipmentDetail id={shipmentIdOf('SH-10441')} />)
      expect(screen.getByText('NO SIGNAL')).toBeTruthy()
      expect(screen.queryByText('Loading shipment…')).toBeNull()
    },
    SLOW_TEST_TIMEOUT_MS,
  )
})
