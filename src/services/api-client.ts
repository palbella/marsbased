import type { z } from 'zod'
import { apiErrorBodySchema } from '@/domain'
import { monitoring, type RequestContext } from '@/lib/monitoring'
import {
  ApiError,
  ConflictError,
  ContractError,
  ForbiddenError,
  NotFoundError,
  TimeoutError,
  UnauthorizedError,
  UnavailableError,
  ValidationError,
} from './errors'
import { tokenStore } from './token-store'

// 02 §5.7: the only thing services know about the backend.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'
// 02 §5.6 "Timeouts".
const DEFAULT_TIMEOUT_MS = 10_000
const UPLOAD_TIMEOUT_MS = 30_000
const NO_CONTENT = 204

export interface RequestOptions {
  // TanStack Query's signal, so leaving a view aborts its requests.
  signal?: AbortSignal
  timeoutMs?: number
}

export interface DownloadedFile {
  blob: Blob
  fileName: string | null
}

interface ApiRequest {
  method: 'GET' | 'POST'
  path: string
  json?: unknown
  form?: FormData
  options?: RequestOptions
}

export async function apiGet<T>(path: string, schema: z.ZodType<T>, options?: RequestOptions) {
  const { response, context } = await send({ method: 'GET', path, options })
  return parse(response, schema, context)
}

// For endpoints that answer 204 when there is nothing to return.
export async function apiGetOptional<T>(
  path: string,
  schema: z.ZodType<T>,
  options?: RequestOptions,
): Promise<T | null> {
  const { response, context } = await send({ method: 'GET', path, options })
  return response.status === NO_CONTENT ? null : parse(response, schema, context)
}

export async function apiPost<T>(
  path: string,
  json: unknown,
  schema: z.ZodType<T>,
  options?: RequestOptions,
): Promise<T> {
  const { response, context } = await send({ method: 'POST', path, json, options })
  return parse(response, schema, context)
}

// For endpoints that answer 204.
export async function apiPostEmpty(path: string, json?: unknown, options?: RequestOptions) {
  await send({ method: 'POST', path, json, options })
}

export async function apiUpload<T>(
  path: string,
  form: FormData,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? UPLOAD_TIMEOUT_MS
  const { response, context } = await send({
    method: 'POST',
    path,
    form,
    options: { ...options, timeoutMs },
  })
  return parse(response, schema, context)
}

export async function apiDownload(path: string, options?: RequestOptions): Promise<DownloadedFile> {
  const { response } = await send({ method: 'GET', path, options })
  const disposition = response.headers.get('content-disposition') ?? ''
  const fileName = /filename="([^"]+)"/.exec(disposition)?.[1] ?? null
  return { blob: await response.blob(), fileName }
}

async function send({ method, path, json, form, options = {} }: ApiRequest) {
  const requestId = crypto.randomUUID()
  const context: RequestContext = { method, path, status: null, requestId }
  const timeout = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  const signals = options.signal ? [timeout, options.signal] : [timeout]
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: headersFor(requestId, json !== undefined),
      body: form ?? (json === undefined ? undefined : JSON.stringify(json)),
      signal: AbortSignal.any(signals),
    })
  } catch (error) {
    throw transportError(error, timeout, context)
  }
  const answered = { ...context, status: response.status }
  if (!response.ok) throw await toApiError(response, answered)
  return { response, context: answered }
}

function headersFor(requestId: string, hasJson: boolean): Headers {
  const headers = new Headers({ 'x-request-id': requestId })
  const token = tokenStore.get()
  if (token) headers.set('authorization', `Bearer ${token}`)
  if (hasJson) headers.set('content-type', 'application/json')
  return headers
}

// No response: our timeout → TimeoutError; the caller's abort is a cancellation, not an
// API error, so it propagates as is; anything else is the network.
function transportError(error: unknown, timeout: AbortSignal, context: RequestContext): unknown {
  if (timeout.aborted) return new TimeoutError('The request timed out.', 0, 'timeout', context)
  if (error instanceof DOMException && error.name === 'AbortError') return error
  return new UnavailableError('The service could not be reached.', 0, 'network_error', context)
}

async function toApiError(response: Response, context: RequestContext): Promise<ApiError> {
  const body = apiErrorBodySchema.safeParse(await response.json().catch(() => null))
  const message = body.success ? body.data.message : response.statusText || 'Request failed.'
  const code = body.success ? body.data.code : 'unknown'
  const error = errorFor(response.status, message, code, context)
  if (response.status === 401) tokenStore.clear()
  // 02 §5.8: expected API errors are business outcomes, not incidents.
  if (!(error instanceof UnavailableError)) {
    monitoring.addBreadcrumb({
      category: 'api',
      message: `${error.name} ${context.method} ${context.path}`,
      data: { ...context },
    })
  }
  return error
}

function errorFor(status: number, message: string, code: string, context: RequestContext) {
  if (status === 401) return new UnauthorizedError(message, status, code, context)
  if (status === 403) return new ForbiddenError(message, status, code, context)
  if (status === 404) return new NotFoundError(message, status, code, context)
  if (status === 409) return new ConflictError(message, status, code, context)
  if (status === 422) return new ValidationError(message, status, code, context)
  if (status >= 500) return new UnavailableError(message, status, code, context)
  return new ApiError(message, status, code, context)
}

// 02 §5.1 rule 1: every response is parsed with its schema; a drift fails loudly.
async function parse<T>(response: Response, schema: z.ZodType<T>, context: RequestContext) {
  const parsed = schema.safeParse(await response.json().catch(() => undefined))
  if (parsed.success) return parsed.data
  const error = new ContractError(
    `Response of ${context.method} ${context.path} does not match its schema.`,
    response.status,
    'contract_violation',
    context,
  )
  monitoring.captureException(error, { request: context, tags: { area: 'api-contract' } })
  throw error
}
