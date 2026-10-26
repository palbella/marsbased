'use client'

import type { ReactNode } from 'react'
import type { ExceptionActionType } from '@/domain'
import type { ActionDialogProps } from './action-outcome'
import { ContactOperatorDialog } from './contact-operator-dialog'
import { AcknowledgeDialog, ResolveDialog } from './lifecycle-dialogs'
import { NotifyCustomerDialog } from './notify-customer-dialog'
import { UploadDocumentDialog } from './upload-document-dialog'

const DIALOGS: Record<ExceptionActionType, (props: ActionDialogProps) => ReactNode> = {
  notify_customer: NotifyCustomerDialog,
  contact_operator: ContactOperatorDialog,
  upload_document: UploadDocumentDialog,
  acknowledge: AcknowledgeDialog,
  resolve: ResolveDialog,
}

// OP-11..14: one dialog per action of 04 §10.
export function ExceptionActionDialog({
  action,
  ...props
}: ActionDialogProps & { action: ExceptionActionType }) {
  const Dialog = DIALOGS[action]
  return <Dialog {...props} />
}
