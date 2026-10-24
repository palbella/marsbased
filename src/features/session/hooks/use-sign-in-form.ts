'use client'

import { useState, type FormEvent } from 'react'
import { signInRequestSchema, type SignInRequest } from '@/domain'
import { UnauthorizedError, ValidationError } from '@/services'
import { useSession } from './use-session'

// US-00: generic, without revealing whether the email exists.
const INVALID_CREDENTIALS = 'Invalid email or password'
const SERVICE_UNAVAILABLE = 'The service is unavailable. Try again in a moment.'

export type SignInField = keyof SignInRequest
export type SignInFieldErrors = Partial<Record<SignInField, string>>

export interface SignInFormState {
  values: SignInRequest
  fieldErrors: SignInFieldErrors
  formError: string | null
  submitting: boolean
  setField(field: SignInField, value: string): void
  // UI-07: test accounts fill both fields; the user still submits.
  fill(credentials: SignInRequest): void
  submit(event: FormEvent<HTMLFormElement>): Promise<void>
}

// UI-06: client validation with the API schema, progress while submitting, and the email
// kept after a failure. On success the sign-in page redirects.
export function useSignInForm(): SignInFormState {
  const { signIn } = useSession()
  const [values, setValues] = useState<SignInRequest>({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const setField = (field: SignInField, value: string) =>
    setValues((current) => ({ ...current, [field]: value }))

  const fill = (credentials: SignInRequest) => {
    setValues(credentials)
    setFieldErrors({})
    setFormError(null)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors = validate(values)
    setFieldErrors(errors)
    setFormError(null)
    if (Object.keys(errors).length > 0) return
    setSubmitting(true)
    try {
      await signIn(values)
    } catch (error) {
      setFormError(messageFor(error))
      setSubmitting(false)
    }
  }

  return { values, fieldErrors, formError, submitting, setField, fill, submit }
}

function validate(values: SignInRequest): SignInFieldErrors {
  const result = signInRequestSchema.safeParse(values)
  if (result.success) return {}
  const invalid = new Set(result.error.issues.map((issue) => issue.path[0]))
  const errors: SignInFieldErrors = {}
  if (invalid.has('email')) {
    errors.email =
      values.email.trim() === '' ? 'Enter your email address.' : 'Enter a valid email address.'
  }
  if (invalid.has('password')) errors.password = 'Enter your password.'
  return errors
}

function messageFor(error: unknown): string {
  const rejected = error instanceof UnauthorizedError || error instanceof ValidationError
  return rejected ? INVALID_CREDENTIALS : SERVICE_UNAVAILABLE
}
