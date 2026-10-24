import { http, HttpResponse } from 'msw'

// Any origin: relative paths only resolve in the browser, and msw/node runs the same handlers.
export const healthHandlers = [
  http.get('*/api/health', () => HttpResponse.json({ status: 'ok', mocked: true })),
]
