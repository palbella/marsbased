'use client'

import { useState } from 'react'
import type { Exception, Leg } from '@/domain'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useShipment } from '@/features/shipments'
import { useExceptionAction } from '../../hooks/use-exception-action'
import { operatorMessageTemplate } from '../../operator-message'
import { ActionDialog } from './action-dialog'
import type { ActionDialogProps } from './action-outcome'

// OP-12, BR-AC-02: logged only in Phase 1; the exception then waits on the operator.
export function ContactOperatorDialog({ exception, onClose, onDone }: ActionDialogProps) {
  const action = useExceptionAction(exception)
  const operators = shipmentOperators(useShipment(exception.shipmentId).data?.legs, exception)
  const [operatorId, setOperatorId] = useState(exception.operatorId)
  const [message, setMessage] = useState(() => operatorMessageTemplate(exception))
  const operatorName = operators.find((operator) => operator.id === operatorId)?.name
  const submit = () =>
    action.mutate(
      { type: 'contact_operator', payload: { operatorId, message: message.trim() } },
      {
        onSuccess: () =>
          onDone({
            title: `${operatorName ?? 'Operator'} contacted about ${exception.shipmentReference}`,
            detail: 'The exception now waits on the operator.',
          }),
      },
    )
  return (
    <ActionDialog
      title="Contact operator"
      submitLabel="Send"
      onClose={onClose}
      onSubmit={submit}
      canSubmit={message.trim().length > 0}
      pending={action.isPending}
      error={action.error}
    >
      <ContactFields
        operators={operators}
        operatorId={operatorId}
        message={message}
        onOperatorChange={setOperatorId}
        onMessageChange={setMessage}
      />
    </ActionDialog>
  )
}

interface OperatorOption {
  id: string
  name: string
}

interface ContactFieldsProps {
  operators: OperatorOption[]
  operatorId: string
  message: string
  onOperatorChange: (operatorId: string) => void
  onMessageChange: (message: string) => void
}

function ContactFields(props: ContactFieldsProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="contact-operator">Operator</Label>
        <Select
          id="contact-operator"
          value={props.operatorId}
          onChange={(event) => props.onOperatorChange(event.target.value)}
          className="w-full"
        >
          {props.operators.map((operator) => (
            <option key={operator.id} value={operator.id}>
              {operator.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          required
          rows={6}
          value={props.message}
          onChange={(event) => props.onMessageChange(event.target.value)}
        />
      </div>
    </>
  )
}

// BR-AC-02: only the operators that carry a leg of the shipment. The current leg's operator
// is known from the exception, so the choice is there before the shipment loads.
function shipmentOperators(legs: Leg[] | undefined, exception: Exception): OperatorOption[] {
  const options = new Map([[exception.operatorId, exception.operatorName]])
  for (const leg of legs ?? []) options.set(leg.operatorId, leg.operatorName)
  return [...options].map(([id, name]) => ({ id, name }))
}
