import { exceptionActionLabels, type Exception, type ExceptionActionType } from '@/domain'
import { Button, type ButtonVariant } from '@/components/ui/button'

interface NextActionsProps {
  exception: Exception
  onSelect: (action: ExceptionActionType) => void
}

// OP-10, BR-NA-01, BR-NA-02: the suggestions in order, the first one as the `--signal`
// primary, then acknowledge (while open) and resolve. A resolved exception offers nothing.
export function NextActions({ exception, onSelect }: NextActionsProps) {
  if (exception.status === 'resolved') return null
  const lifecycle: ExceptionActionType[] =
    exception.status === 'open' ? ['acknowledge', 'resolve'] : ['resolve']
  const actions: { type: ExceptionActionType; variant: ButtonVariant }[] = [
    ...exception.nextActions.map((type, index) => ({
      type,
      variant: index === 0 ? ('primary' as const) : ('secondary' as const),
    })),
    ...lifecycle.map((type) => ({ type, variant: 'ghost' as const })),
  ]
  return (
    <section aria-labelledby="next-action-title" className="px-4 pt-5">
      <h3 id="next-action-title" className="field-label mb-2">
        Next action
      </h3>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ type, variant }) => (
          <Button key={type} size="small" variant={variant} onClick={() => onSelect(type)}>
            {exceptionActionLabels[type]}
          </Button>
        ))}
      </div>
    </section>
  )
}
