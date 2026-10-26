'use client'

import { CircleCheck, Clock, Download, Upload } from 'lucide-react'
import { documentStatusLabels, documentTypeLabels, type Document } from '@/domain'
import { Button } from '@/components/ui/button'
import { useHighlightTarget } from '@/features/shipments'
import { formatDay } from '@/lib/format-date'
import { cn } from '@/lib/utils'

type Density = 'customer' | 'ops'

// 03 §1.2: customer rows 64 px, ops rows 36 px.
const rowDensity: Record<Density, string> = {
  customer: 'min-h-16 py-3',
  ops: 'min-h-9 py-1.5',
}

interface DocumentListProps {
  documents: Document[]
  // US-C-05, CP-14: the page downloads through the documents service.
  onDownload: (document: Document) => void
  // Ops variant (06 §4): shows the upload button.
  onUpload?: () => void
  density?: Density
  className?: string
}

// SC-08: type, status, date and download, as ruled rows on the sheet.
export function DocumentList({
  documents,
  onDownload,
  onUpload,
  density = 'customer',
  className,
}: DocumentListProps) {
  return (
    <div className={cn('border-y border-rule bg-sheet', className)}>
      {onUpload && (
        <div className="flex justify-end border-b border-rule px-4 py-2">
          <Button size="small" variant="secondary" onClick={onUpload}>
            <Upload aria-hidden strokeWidth={1.5} />
            Upload document
          </Button>
        </div>
      )}
      {documents.length === 0 ? (
        <p className="px-4 py-4 text-sm text-ink-muted">No documents for this shipment yet.</p>
      ) : (
        <ul aria-label="Documents" className="divide-y divide-rule">
          {documents.map((document) => (
            <DocumentRow
              key={document.id}
              document={document}
              density={density}
              onDownload={onDownload}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

interface DocumentRowProps {
  document: Document
  density: Density
  onDownload: (document: Document) => void
}

function DocumentRow({ document, density, onDownload }: DocumentRowProps) {
  const { highlighted } = useHighlightTarget(
    { documentId: document.id },
    { kind: 'document', id: document.id },
  )
  const typeLabel = documentTypeLabels[document.type]
  return (
    <li
      data-highlighted={highlighted || undefined}
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1 px-4 text-sm',
        rowDensity[density],
        highlighted && 'bg-signal/15',
      )}
    >
      <span className="min-w-0 flex-1 basis-40 text-ink">{typeLabel}</span>
      <DocumentStatusCell status={document.status} />
      <span className="w-24 font-mono text-xs text-ink-muted">
        {document.uploadedAt ? (
          <time dateTime={document.uploadedAt}>{formatDay(document.uploadedAt)}</time>
        ) : (
          '—'
        )}
      </span>
      {document.status === 'available' && (
        <Button
          size="small"
          variant="ghost"
          aria-label={`Download ${typeLabel}`}
          onClick={() => onDownload(document)}
        >
          <Download aria-hidden strokeWidth={1.5} />
          Download
        </Button>
      )}
    </li>
  )
}

// The status is an icon and a word, never colour alone (NFR-04).
function DocumentStatusCell({ status }: { status: Document['status'] }) {
  const StatusIcon = status === 'available' ? CircleCheck : Clock
  return (
    <span className="inline-flex w-24 items-center gap-1.5 text-ink-muted">
      <StatusIcon aria-hidden className="size-4" strokeWidth={1.5} />
      {documentStatusLabels[status]}
    </span>
  )
}
