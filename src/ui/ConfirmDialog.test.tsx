import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmDialog } from './ConfirmDialog'

function renderConfirmDialog(
  overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {},
) {
  const onCancel = vi.fn()
  const onConfirm = vi.fn()

  render(
    <ConfirmDialog
      confirmLabel="Delete book"
      message="Delete Effective Java?"
      title="Confirm deletion"
      onCancel={onCancel}
      onConfirm={onConfirm}
      {...overrides}
    />,
  )

  return { onCancel, onConfirm }
}

describe('ConfirmDialog', () => {
  it('opens as a modal with the title and record message', () => {
    renderConfirmDialog()

    const dialog = screen.getByRole('dialog')

    expect(dialog).toHaveAttribute('open')
    expect(dialog).toHaveAccessibleName('Confirm deletion')
    expect(screen.getByText('Delete Effective Java?')).toBeInTheDocument()
  })

  it('focuses the cancel action initially so Enter cannot delete by accident', () => {
    renderConfirmDialog()

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })

  it('fires onConfirm from the danger action only', () => {
    const { onCancel, onConfirm } = renderConfirmDialog()

    fireEvent.click(screen.getByRole('button', { name: 'Delete book' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('fires onCancel from the cancel action', () => {
    const { onCancel, onConfirm } = renderConfirmDialog()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
