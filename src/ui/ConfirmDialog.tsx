import { useEffect, useRef, type ReactNode } from 'react'

import { useI18n } from '../i18n/useI18n'

export function ConfirmDialog({
  cancelLabel,
  confirmLabel,
  message,
  onCancel,
  onConfirm,
  title,
}: {
  cancelLabel?: string
  confirmLabel: string
  message: ReactNode
  onCancel: () => void
  onConfirm: () => void
  title: string
}) {
  const { t } = useI18n()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  // Counts close() calls made by effect cleanup so their close events are
  // not mistaken for a user cancel. Without this, the StrictMode
  // mount-cleanup-mount cycle cancels the dialog before it is ever seen in
  // browsers that dispatch the close event synchronously.
  const cleanupCloseCountRef = useRef(0)

  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog && !dialog.open) {
      dialog.showModal()
      dialog.querySelector<HTMLElement>('.confirm-dialog-cancel')?.focus()
    }

    return () => {
      if (dialog?.open) {
        cleanupCloseCountRef.current += 1
        dialog.close()
      }
    }
  }, [])

  // Only user-initiated closes (Escape and similar) cancel; closes issued
  // by this component's own cleanup are absorbed by the counter.
  function handleNativeClose() {
    if (cleanupCloseCountRef.current > 0) {
      cleanupCloseCountRef.current -= 1

      return
    }

    onCancel()
  }

  return (
    <dialog
      aria-labelledby="confirm-dialog-title"
      className="confirm-dialog"
      ref={dialogRef}
      onClose={handleNativeClose}
    >
      <h2 className="confirm-dialog-title" id="confirm-dialog-title">
        {title}
      </h2>
      <p className="confirm-dialog-message">{message}</p>
      <div className="confirm-dialog-actions">
        <button
          className="secondary-button confirm-dialog-cancel"
          type="button"
          onClick={onCancel}
        >
          {cancelLabel ?? t('ui.common.cancel')}
        </button>
        <button className="danger-button" type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
