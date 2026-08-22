import type { ReactNode } from 'react'
import { AlertTriangle, X } from 'lucide-react'

import Button from './Button'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel()
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--os-border-strong)] bg-[var(--os-surface)] shadow-[var(--os-shadow-lg)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--os-border)] p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,100,124,0.12)] text-[var(--os-danger)]">
              <AlertTriangle size={19} />
            </span>

            <div className="min-w-0">
              <h2
                id="confirm-dialog-title"
                className="text-base font-semibold text-[var(--os-text)]"
              >
                {title}
              </h2>

              <div
                id="confirm-dialog-description"
                className="mt-1.5 text-sm leading-6 text-[var(--os-text-secondary)]"
              >
                {description}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close confirmation dialog"
            className="os-focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--os-text-muted)] transition-colors hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-text)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant="danger"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
