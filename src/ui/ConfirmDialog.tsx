import { useEffect, useRef, type ReactNode } from 'react'

export function ConfirmDialog({
  cancelLabel = 'Cancel',
  confirmLabel,
  message,
  onCancel,
  onConfirm,
  title,
}: {
  cancelLabel?: string
  confirmLabel: string
  message: ReactNode
  // Fires for every non-confirm close, including the native close that runs
  // on unmount after a confirm, so cancel handlers must stay idempotent.
  onCancel: () => void
  onConfirm: () => void
  title: string
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog && !dialog.open) {
      dialog.showModal()
      dialog.querySelector<HTMLElement>('.confirm-dialog-cancel')?.focus()
    }

    return () => {
      if (dialog?.open) {
        dialog.close()
      }
    }
  }, [])

  return (
    <dialog
      aria-labelledby="confirm-dialog-title"
      className="confirm-dialog"
      ref={dialogRef}
      onClose={onCancel}
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
          {cancelLabel}
        </button>
        <button className="danger-button" type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
