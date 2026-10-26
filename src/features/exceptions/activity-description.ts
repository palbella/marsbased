import { documentTypeLabels, type ActivityEntry } from '@/domain'

// OP-10 history: one line per activity entry, in the agent's words.
export function describeActivity(entry: ActivityEntry): string {
  switch (entry.type) {
    case 'exception_raised':
      return `Raised automatically: ${entry.payload.reason}`
    case 'exception_auto_resolved':
      return `Resolved automatically: ${entry.payload.reason}`
    case 'notify_customer':
      return `Customer notified: "${entry.payload.subject}"`
    case 'contact_operator':
      return 'Operator contacted'
    case 'upload_document':
      return `${documentTypeLabels[entry.payload.type]} uploaded (${entry.payload.fileName})`
    case 'acknowledge':
      return 'Acknowledged'
    case 'resolve':
      return `Resolved: ${entry.payload.note}`
  }
}

// The exception's own entries, oldest first.
export function exceptionHistory(entries: readonly ActivityEntry[], exceptionId: string) {
  return entries
    .filter((entry) => entry.exceptionId === exceptionId)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
}
