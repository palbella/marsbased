import { Select } from './select'

export interface FilterOption {
  value: string
  label: string
}

interface FilterSelectProps {
  label: string
  // The empty value: no filter.
  emptyLabel: string
  value: string | undefined
  options: FilterOption[]
  onChange: (value: string) => void
}

// A labelled filter of a list header (OP-04, OP-21); the empty option clears it.
export function FilterSelect({ label, emptyLabel, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="flex min-w-0 items-center gap-2">
      <span className="field-label">{label}</span>
      <Select value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </label>
  )
}
