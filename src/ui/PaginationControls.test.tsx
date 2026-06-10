import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PaginationControls } from './PaginationControls'

function renderPager(
  overrides: Partial<Parameters<typeof PaginationControls>[0]> = {},
) {
  const onPageChange = vi.fn()

  render(
    <PaginationControls
      ariaLabel="Test pagination"
      first={false}
      last={false}
      pageNumber={5}
      pageSizeOptions={[10, 20, 50]}
      querySize={10}
      totalPages={20}
      onNextPage={() => {}}
      onPageChange={onPageChange}
      onPageSizeChange={() => {}}
      onPreviousPage={() => {}}
      {...overrides}
    />,
  )

  return { onPageChange }
}

describe('PaginationControls pager', () => {
  it('windows numbered pages around the current page with gaps', () => {
    const { onPageChange } = renderPager()

    const pager = screen.getByRole('navigation', { name: 'Test pagination' })
    const labels = [...pager.querySelectorAll('button, span')].map(
      (node) => node.getAttribute('aria-label') ?? node.textContent,
    )

    expect(labels).toEqual([
      'Previous page',
      'Page 1',
      '…',
      'Page 5',
      'Page 6',
      'Page 7',
      '…',
      'Page 20',
      'Next page',
    ])
    expect(screen.getByRole('button', { name: 'Page 6' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Page 20' }))
    expect(onPageChange).toHaveBeenCalledWith(19)

    fireEvent.click(screen.getByRole('button', { name: 'Page 6' }))
    expect(onPageChange).toHaveBeenCalledTimes(1)
  })

  it('keeps the leading window without a gap near the first pages', () => {
    renderPager({ pageNumber: 1 })

    const pager = screen.getByRole('navigation', { name: 'Test pagination' })
    const pages = [...pager.querySelectorAll('button[aria-label^="Page"]')].map(
      (button) => button.textContent,
    )

    expect(pages).toEqual(['1', '2', '3', '4', '5', '20'])
    expect(pager.querySelectorAll('.page-gap')).toHaveLength(1)
  })

  it('keeps busy paging focusable with aria-disabled and guarded clicks', () => {
    const onNextPage = vi.fn()
    const { onPageChange } = renderPager({ disabled: true, onNextPage })

    const pageButton = screen.getByRole('button', { name: 'Page 20' })
    const nextButton = screen.getByRole('button', { name: 'Next page' })
    expect(pageButton).not.toBeDisabled()
    expect(pageButton).toHaveAttribute('aria-disabled', 'true')
    expect(nextButton).not.toBeDisabled()
    expect(nextButton).toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(pageButton)
    fireEvent.click(nextButton)
    expect(onPageChange).not.toHaveBeenCalled()
    expect(onNextPage).not.toHaveBeenCalled()
  })

  it('hard-disables only the first and last boundaries', () => {
    renderPager({ first: true, last: true })

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('falls back to a status stepper when total pages are unknown', () => {
    renderPager({ pageNumber: 2, totalPages: 0 })

    const pager = screen.getByRole('navigation', { name: 'Test pagination' })
    expect(pager).toHaveTextContent('Page 3')
    expect(pager.querySelectorAll('button[aria-label^="Page"]')).toHaveLength(0)
    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Next page' }),
    ).toBeInTheDocument()
  })
})

describe('PaginationControls toolbar', () => {
  it('offers rows-per-page and steppers without repeating the page position', () => {
    renderPager({ variant: 'toolbar' })

    const toolbar = screen.getByLabelText('Test pagination')
    expect(within(toolbar).getByLabelText('Rows per page')).toBeInTheDocument()
    expect(
      within(toolbar).getByRole('button', { name: 'Previous page' }),
    ).toBeInTheDocument()
    expect(
      within(toolbar).getByRole('button', { name: 'Next page' }),
    ).toBeInTheDocument()
    expect(toolbar).not.toHaveTextContent(/Page \d/)
  })
})
