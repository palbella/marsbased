import { failureModeSchema, type FailureMode } from '@/domain'

// 02 §5.6, OP-55: the failure mode applies to the current tab only, so it lives in
// `sessionStorage` (handlers run in each tab's page context); in memory in Node.
const STORAGE_KEY = 'mock-api:failure-mode'
const DEFAULT_MODE: FailureMode = 'normal'

let memoryMode: FailureMode = DEFAULT_MODE

export function getFailureMode(): FailureMode {
  if (typeof window === 'undefined') return memoryMode
  const stored = failureModeSchema.safeParse(sessionStorage.getItem(STORAGE_KEY))
  return stored.success ? stored.data : DEFAULT_MODE
}

export function setFailureMode(mode: FailureMode): void {
  if (typeof window === 'undefined') {
    memoryMode = mode
    return
  }
  sessionStorage.setItem(STORAGE_KEY, mode)
}
