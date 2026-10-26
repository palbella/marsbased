'use client'

import { CircleAlertIcon, ClockAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SignInField, SignInFormState } from '../hooks/use-sign-in-form'

interface SignInFormProps {
  form: SignInFormState
  // UI-09: arrived here because the session expired.
  expired: boolean
}

// UI-06.
export function SignInForm({ form, expired }: SignInFormProps) {
  const { values, fieldErrors, formError, submitting, setField, submit } = form
  return (
    <form
      noValidate
      onSubmit={submit}
      aria-labelledby="sign-in-title"
      className="flex flex-col gap-5"
    >
      <SignInHeading expired={expired} />
      <SignInInput
        field="email"
        label="Email"
        type="email"
        autoComplete="username"
        value={values.email}
        error={fieldErrors.email}
        onChange={setField}
      />
      <SignInInput
        field="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={values.password}
        error={fieldErrors.password}
        onChange={setField}
      />
      <Button type="submit" disabled={submitting} aria-busy={submitting} className="w-full">
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>
      {formError && <ErrorMessage role="alert">{formError}</ErrorMessage>}
    </form>
  )
}

function SignInHeading({ expired }: { expired: boolean }) {
  return (
    <>
      <h1
        id="sign-in-title"
        className="font-condensed text-2xl font-semibold tracking-wide uppercase"
      >
        Sign in
      </h1>
      {expired && (
        <p role="status" className="flex items-center gap-2 border-l-2 border-ink pl-3 text-sm">
          <ClockAlertIcon className="size-4" strokeWidth={1.5} aria-hidden />
          Your session has expired. Sign in again.
        </p>
      )}
    </>
  )
}

interface SignInInputProps {
  field: SignInField
  label: string
  type: 'email' | 'password'
  autoComplete: string
  value: string
  error: string | undefined
  onChange(field: SignInField, value: string): void
}

function SignInInput({
  field,
  label,
  type,
  autoComplete,
  value,
  error,
  onChange,
}: SignInInputProps) {
  const id = `sign-in-${field}`
  const errorId = `${id}-error`
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={field}
        type={type}
        autoComplete={autoComplete}
        value={value}
        aria-invalid={error !== undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(field, event.target.value)}
      />
      {error && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
    </div>
  )
}

function ErrorMessage({ id, role, children }: { id?: string; role?: 'alert'; children: string }) {
  return (
    <p id={id} role={role} className="flex items-center gap-2 text-sm text-late">
      <CircleAlertIcon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
      {children}
    </p>
  )
}
