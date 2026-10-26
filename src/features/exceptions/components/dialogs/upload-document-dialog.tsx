'use client'

import { useState } from 'react'
import { documentTypeLabels, type DocumentType, type Exception } from '@/domain'
import {
  DocumentTypeField,
  FileField,
  fileProblem,
  missingDocumentType,
  useDocuments,
} from '@/features/documents'
import { useExceptionAction } from '../../hooks/use-exception-action'
import { ActionDialog } from './action-dialog'
import type { ActionDialogProps } from './action-outcome'

// OP-13, BR-AC-03: only the metadata is stored in Phase 1. It goes through the actions
// endpoint, so the upload lands in the exception's history.
export function UploadDocumentDialog({ exception, onClose, onDone }: ActionDialogProps) {
  const action = useExceptionAction(exception)
  const documents = useDocuments(exception.shipmentId)
  const loading = documents.isPending
  // The agent's choice; until they choose, the missing document is pre-selected.
  const [chosenType, setChosenType] = useState<DocumentType | null>(null)
  const type = chosenType ?? missingDocumentType(documents.data ?? [])
  const [file, setFile] = useState<File | null>(null)
  const problem = fileProblem(file)
  const submit = () => {
    if (!file || !type) return
    action.mutate(
      { type: 'upload_document', payload: { type, fileName: file.name, size: file.size } },
      { onSuccess: (updated) => onDone(uploadOutcome(updated, type)) },
    )
  }
  return (
    <ActionDialog
      title="Upload document"
      submitLabel="Upload"
      onClose={onClose}
      onSubmit={submit}
      canSubmit={!loading && type !== null && problem === null}
      pending={action.isPending}
      error={action.error}
    >
      <DocumentTypeField type={type} loading={loading} onChange={setChosenType} />
      <FileField file={file} problem={problem} onChange={setFile} />
    </ActionDialog>
  )
}

// OP-13: say whether the upload resolved the exception (BR-EX-07 via BR-EX-10).
function uploadOutcome(updated: Exception, type: DocumentType) {
  const resolved = updated.status === 'resolved'
  return {
    title: `${documentTypeLabels[type]} uploaded to ${updated.shipmentReference}`,
    detail: resolved
      ? 'The exception was resolved automatically by the upload.'
      : 'The exception is still open.',
  }
}
