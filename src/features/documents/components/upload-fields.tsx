'use client'

import {
  DOCUMENT_MIME_TYPE,
  documentTypeLabels,
  documentTypeSchema,
  type DocumentType,
} from '@/domain'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

// OP-13, OP-30 Documents tab: the fields of an upload, shared by the exception action and the
// multipart upload.
interface DocumentTypeFieldProps {
  type: DocumentType | null
  loading: boolean
  onChange: (type: DocumentType | null) => void
}

export function DocumentTypeField({ type, loading, onChange }: DocumentTypeFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="upload-type">Document type</Label>
      <Select
        id="upload-type"
        value={type ?? ''}
        disabled={loading}
        onChange={(event) =>
          onChange(documentTypeSchema.safeParse(event.target.value).data ?? null)
        }
        className="w-full"
      >
        <option value="">{loading ? 'Loading documents…' : 'Choose a type'}</option>
        {documentTypeSchema.options.map((option) => (
          <option key={option} value={option}>
            {documentTypeLabels[option]}
          </option>
        ))}
      </Select>
    </div>
  )
}

interface FileFieldProps {
  file: File | null
  problem: string | null
  onChange: (file: File | null) => void
}

export function FileField({ file, problem, onChange }: FileFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="upload-file">File (PDF, max 10 MB)</Label>
      <Input
        id="upload-file"
        type="file"
        accept={DOCUMENT_MIME_TYPE}
        aria-invalid={file !== null && problem !== null}
        aria-describedby="upload-file-hint"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="py-2"
      />
      <p id="upload-file-hint" className="text-xs text-ink-muted">
        {file && problem ? problem : 'Only the file name and size are stored.'}
      </p>
    </div>
  )
}
