// UI-09, 02 §8: a 401 on a request that carried a token means the session expired. The
// api-client raises it; the session layer listens and signs the tab out.
type SessionExpiredListener = () => void

const listeners = new Set<SessionExpiredListener>()

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notifySessionExpired(): void {
  listeners.forEach((listener) => listener())
}
