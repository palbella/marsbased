import type { RequestContext } from '@/lib/monitoring'

// 02 §5.6: `api-client.ts` is the only place that creates these. Names are set explicitly
// because minification renames classes.
export class ApiError extends Error {
  name = 'ApiError'

  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly request: RequestContext,
  ) {
    super(message)
  }
}

// 401 → the session is cleared and the user goes back to sign-in (UI-09).
export class UnauthorizedError extends ApiError {
  name = 'UnauthorizedError'
}

// 403: the role can never use this endpoint (BR-PM-03).
export class ForbiddenError extends ApiError {
  name = 'ForbiddenError'
}

// 404, also out of perimeter (BR-PM-02).
export class NotFoundError extends ApiError {
  name = 'NotFoundError'
}

// 409, e.g. an action on a resolved exception (BR-AC-06).
export class ConflictError extends ApiError {
  name = 'ConflictError'
}

// 422 (BR-AC-06).
export class ValidationError extends ApiError {
  name = 'ValidationError'
}

// 5xx, network errors and injected failures; queries retry these (02 §5.6 "Retries").
export class UnavailableError extends ApiError {
  name = 'UnavailableError'
}

// No response within the timeout.
export class TimeoutError extends UnavailableError {
  name = 'TimeoutError'
}

// The response doesn't match its Zod schema: always a bug, never expected (02 §5.8).
export class ContractError extends ApiError {
  name = 'ContractError'
}
