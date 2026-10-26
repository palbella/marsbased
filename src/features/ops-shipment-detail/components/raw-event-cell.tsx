'use client'

import type { RawEvent } from '@/domain'
import { formatStamp } from '@/lib/format-date'

interface RawEventCellProps {
  event: RawEvent | undefined
  operatorName: string
}

// OP-30: the operator message next to what it was normalised into, e.g.
// `BlueWave · "VD" · Vessel departed Valencia`, received time, original payload on expand.
export function RawEventCell({ event, operatorName }: RawEventCellProps) {
  if (!event) return <span>—</span>
  return (
    <span className="block min-w-0 space-y-0.5">
      <span className="block truncate text-ink" title={`${event.code} · ${event.label}`}>
        {operatorName} · &quot;{event.code}&quot;
        {/* Formats that only send a code have nothing more to say. */}
        {event.label !== event.code && <> · {event.label}</>}
      </span>
      <span className="block">
        Received <time dateTime={event.receivedAt}>{formatStamp(event.receivedAt)}</time>
      </span>
      <details className="group">
        <summary className="cursor-pointer rounded-xs underline-offset-2 hover:underline">
          Payload
        </summary>
        <pre className="mt-1 max-w-full overflow-x-auto border border-rule bg-paper p-2 text-[11px] whitespace-pre-wrap text-ink">
          {formatPayload(event.payload)}
        </pre>
      </details>
    </span>
  )
}

// CSV lines stay as received; JSON-like payloads are indented to be read.
function formatPayload(payload: RawEvent['payload']): string {
  return typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)
}
