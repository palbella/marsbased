'use client'

import { CircleAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { documentTypeLabels, type Document, type DocumentType } from '@/domain'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { UnavailableError, ValidationError } from '@/services'
import { useUploadDocument } from '../hooks/use-upload-document'
import { fileProblem, missingDocumentType } from '../upload-rules'
import { DocumentTypeField, FileField } from './upload-fields'

interface UploadDocumentDialogProps {
  shipmentId: string
  documents: Document[]
  onClose: () => void
  onUploaded: (message: string) => void
}

// OP-30 Documents tab: `POST /api/shipments/:id/documents` (multipart, metadata only). The
// missing document is pre-selected (OP-13); a failure keeps the choice and the file (OP-16).
export function UploadDocumentDialog({
  shipmentId,
  documents,
  onClose,
  onUploaded,
}: UploadDocumentDialogProps) {
  const upload = useUploadDocument(shipmentId)
  const [chosenType, setChosenType] = useState<DocumentType | null>(null)
  const type = chosenType ?? missingDocumentType(documents)
  const [file, setFile] = useState<File | null>(null)
  const problem = fileProblem(file)
  const canSubmit = type !== null && file !== null && problem === null && !upload.isPending
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    upload.mutate(
      { type, file },
      { onSuccess: () => onUploaded(`${documentTypeLabels[type]} uploaded.`) },
    )
  }
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Upload document</DialogTitle>
        <form onSubmit={submit} className="flex flex-col gap-4 px-4 py-4">
          <DocumentTypeField type={type} loading={false} onChange={setChosenType} />
          <FileField file={file} problem={problem} onChange={setFile} />
          {upload.error && <UploadError error={upload.error} />}
          <DialogButtons
            canSubmit={canSubmit}
            label={submitLabel(upload.isPending, upload.error)}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DialogButtons({ canSubmit, label }: { canSubmit: boolean; label: string }) {
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t border-rule pt-4">
      <DialogClose asChild>
        <Button type="button" variant="ghost">
          Cancel
        </Button>
      </DialogClose>
      <Button type="submit" disabled={!canSubmit}>
        {label}
      </Button>
    </div>
  )
}

function submitLabel(pending: boolean, error: Error | null): string {
  if (pending) return 'Uploading…'
  return error ? 'Try again' : 'Upload'
}

function UploadError({ error }: { error: Error }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 border-l-2 border-late pl-3 text-sm text-late"
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
      {uploadErrorMessage(error)}
    </p>
  )
}

function uploadErrorMessage(error: Error): string {
  if (error instanceof ValidationError) return `The upload was rejected: ${error.message}`
  if (error instanceof UnavailableError) {
    return 'The service is unavailable. Nothing was uploaded; try again.'
  }
  return 'Something went wrong. Nothing was uploaded; try again.'
}
