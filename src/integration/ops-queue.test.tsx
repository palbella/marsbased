// @vitest-environment jsdom
import '@/test/dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Exception, ExceptionType, NextActionType } from '@/domain'
import { ExceptionPanel } from '@/features/exceptions'
import { setFailureMode } from '@/mocks/failure-mode'
import { alertsService, createQueryClient, exceptionsService } from '@/services'
import { resetData, setupMockApi, signInAs, SLOW_TEST_TIMEOUT_MS, USERS } from './setup'

setupMockApi()

beforeEach(async () => {
  resetData()
  await signInAs(USERS.marc)
}, SLOW_TEST_TIMEOUT_MS)

async function activeException(reference: string, type: ExceptionType): Promise<Exception> {
  const queue = await exceptionsService.list()
  const exception = queue.find((item) => item.shipmentReference === reference && item.type === type)
  if (!exception) throw new Error(`No active ${type} on ${reference}`)
  return exception
}

function renderPanel(exceptionId: string, requestedAction: NextActionType) {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <ExceptionPanel
        exceptionId={exceptionId}
        requestedAction={requestedAction}
        onClose={() => undefined}
      />
    </QueryClientProvider>,
  )
}

describe('07 §5: Marc Puig lands on the attention queue (OP-01, BR-PR-02)', () => {
  it('lists the exceptions in the exact order and with the exact scores', async () => {
    const queue = await exceptionsService.list()
    expect(queue.map((item) => [item.shipmentReference, item.type, item.priorityScore])).toEqual([
      ['SH-10441', 'hold', 90],
      ['SH-10444', 'customs_incident', 60],
      ['SH-10436', 'delay', 60],
      ['SH-10411', 'delay', 54],
      ['SH-10438', 'missing_document', 48],
      ['SH-10409', 'delay', 24],
    ])
    expect(queue[1]?.waitingOn).toBe('operator')
  })
})

describe('OP-11 notify customer with the AI draft', () => {
  it(
    'sends the draft only on Send, and Diego sees the alert',
    async () => {
      const delay = await activeException('SH-10436', 'delay')
      renderPanel(delay.id, 'notify_customer')
      const dialog = await screen.findByRole('dialog', { name: 'Notify customer' })
      const subject = within(dialog).getByLabelText('Subject')
      await waitFor(() =>
        expect(subject).toHaveProperty('value', expect.stringContaining('SH-10436')),
      )
      expect(within(dialog).getByText(/AI note · Draft message/i)).toBeTruthy()
      const draftedSubject = (subject as HTMLInputElement).value
      // P3: the draft changed nothing on its own.
      expect((await exceptionsService.getById(delay.id)).status).toBe('open')

      await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }))
      const panel = await screen.findByRole('article', { name: 'Exception on SH-10436' })
      await within(panel).findByText(/Customer notified about SH-10436/, {}, { timeout: 5_000 })

      await signInAs(USERS.diego)
      expect(await alertsWithTitle(delay.shipmentId, draftedSubject)).toHaveLength(1)
    },
    SLOW_TEST_TIMEOUT_MS,
  )

  it(
    'OP-16: a forced API error keeps what the agent typed',
    async () => {
      const delay = await activeException('SH-10436', 'delay')
      renderPanel(delay.id, 'notify_customer')
      const dialog = await screen.findByRole('dialog', { name: 'Notify customer' })
      const message = within(dialog).getByLabelText('Message')
      await waitFor(() => expect(message).toHaveProperty('value', expect.stringContaining('Dear')))
      await userEvent.type(message, ' Edited by the agent.')
      expect(within(dialog).queryByText(/AI note · Draft message/i)).toBeNull()

      setFailureMode('down')
      await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }))
      const error = await within(dialog).findByRole('alert', {}, { timeout: 5_000 })
      expect(error.textContent).toMatch(/unavailable/i)
      expect((message as HTMLTextAreaElement).value).toMatch(/Edited by the agent\.$/)
      expect(within(dialog).getByRole('button', { name: 'Try again' })).toBeTruthy()
    },
    SLOW_TEST_TIMEOUT_MS,
  )
})

describe('OP-13 upload document', () => {
  it(
    'the commercial invoice on SH-10438 resolves missing_document and the queue drops by one',
    async () => {
      const before = await exceptionsService.list()
      const missing = await activeException('SH-10438', 'missing_document')
      renderPanel(missing.id, 'upload_document')
      const dialog = await screen.findByRole('dialog', { name: 'Upload document' })
      const type = within(dialog).getByLabelText('Document type')
      await waitFor(() => expect(type).toHaveProperty('value', 'commercial_invoice'))
      const file = new File(['%PDF-1.4'], 'invoice.pdf', { type: 'application/pdf' })
      await userEvent.upload(within(dialog).getByLabelText(/File/), file)
      await userEvent.click(within(dialog).getByRole('button', { name: 'Upload' }))

      const panel = await screen.findByRole('article', { name: 'Exception on SH-10438' })
      await within(panel).findByText(/resolved automatically by the upload/, {}, { timeout: 5_000 })
      const after = await exceptionsService.list()
      expect(after).toHaveLength(before.length - 1)
      expect(after.some((item) => item.id === missing.id)).toBe(false)
    },
    SLOW_TEST_TIMEOUT_MS,
  )
})

async function alertsWithTitle(shipmentId: string, title: string) {
  const alerts = await alertsService.list({ shipmentId })
  return alerts.filter((alert) => alert.title === title)
}
