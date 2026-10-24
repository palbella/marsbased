import { delay, HttpResponse, type PathParams } from 'msw'
import type { z } from 'zod'
import type { ApiErrorBody, ApiErrorCode, FailureMode } from '@/domain'
import { database } from './db/instance'
import { getFailureMode } from './failure-mode'

// 02 §5.6 "Simulating failures"; NFR-05 for the normal latency.
const NORMAL_LATENCY_MS = { min: 150, max: 400 }
const SLOW_LATENCY_MS = { min: 3_000, max: 8_000 }
// Longer than the client's 10 s timeout, so the request ends in a `TimeoutError`.
const TIMEOUT_LATENCY_MS = 15_000
const FLAKY_FAILURE_RATE = 0.3

const REQUEST_ID_HEADER = 'x-request-id'

export interface MockRequestInfo {
  request: Request
  params: PathParams
  // JSON body, multipart `FormData`, or null; read before the synchronous section.
  body: unknown
}

// Synchronous on purpose: nothing may run between `refresh()` and `persistIfChanged()`.
export type MockResolver = (info: MockRequestInfo) => Response

interface MockOptions {
  // The network endpoint must always answer, so the panel can switch back to Normal.
  exemptFromFailureMode?: boolean
}

// 02 §5.4: every handler behaves like a real network call.
export function withMockLatency(resolver: MockResolver, options: MockOptions = {}) {
  return async ({ request, params }: { request: Request; params: PathParams }) => {
    const mode: FailureMode = options.exemptFromFailureMode ? 'normal' : getFailureMode()
    await delay(latencyFor(mode))
    const response = shouldFail(mode)
      ? serviceUnavailable()
      : resolveSynchronously(resolver, { request, params, body: await readBody(request) })
    response.headers.set(REQUEST_ID_HEADER, request.headers.get(REQUEST_ID_HEADER) ?? '')
    return response
  }
}

// 02 §5.5: refresh → resolver → persist with no `await`, so a tab never writes on top of a
// stale copy.
function resolveSynchronously(resolver: MockResolver, info: MockRequestInfo): Response {
  database.refresh()
  try {
    return info.body instanceof InvalidJson
      ? validationFailed('Invalid JSON body.')
      : resolver(info)
  } catch (error) {
    // Guards such as `requireUser` throw their error response.
    if (error instanceof Response) return error
    throw error
  } finally {
    database.persistIfChanged()
  }
}

class InvalidJson {}

async function readBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('multipart/form-data')) return request.formData()
  if (!contentType.includes('application/json')) return null
  try {
    return await request.json()
  } catch {
    return new InvalidJson()
  }
}

function latencyFor(mode: FailureMode): number {
  if (mode === 'timeouts') return TIMEOUT_LATENCY_MS
  const range = mode === 'slow' ? SLOW_LATENCY_MS : NORMAL_LATENCY_MS
  return range.min + Math.random() * (range.max - range.min)
}

function shouldFail(mode: FailureMode): boolean {
  if (mode === 'down') return true
  return mode === 'flaky' && Math.random() < FLAKY_FAILURE_RATE
}

export function param(params: PathParams, name: string): string {
  return String(params[name])
}

// Query parameters and bodies are validated like a real API would: invalid → 422.
export function parseQuery<T>(request: Request, schema: z.ZodType<T>): T {
  const query = Object.fromEntries(new URL(request.url).searchParams)
  return parseOrReject(query, schema, 'Invalid query parameters.')
}

export function parseBody<T>(body: unknown, schema: z.ZodType<T>): T {
  return parseOrReject(body, schema, 'Invalid request body.')
}

function parseOrReject<T>(value: unknown, schema: z.ZodType<T>, message: string): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw validationFailed(message)
  return parsed.data
}

export function noContent(): Response {
  return new HttpResponse(null, { status: 204 })
}

function errorResponse(status: number, code: ApiErrorCode, message: string): Response {
  const body: ApiErrorBody = { code, message }
  return HttpResponse.json(body, { status })
}

// 401 with a generic message, so it never says whether the e-mail exists (02 §5.4 "Auth").
export const unauthorized = (message = 'Invalid credentials or session.') =>
  errorResponse(401, 'unauthorized', message)
// BR-PM-03.
export const forbidden = () => errorResponse(403, 'forbidden', 'Not allowed for your role.')
// BR-PM-02: also out of perimeter, so it never reveals whether the resource exists.
export const notFound = () => errorResponse(404, 'not_found', 'Not found.')
export const conflict = (message: string) => errorResponse(409, 'conflict', message)
export const validationFailed = (message: string) =>
  errorResponse(422, 'validation_failed', message)
export const serviceUnavailable = () =>
  errorResponse(503, 'unavailable', 'The service is unavailable.')
