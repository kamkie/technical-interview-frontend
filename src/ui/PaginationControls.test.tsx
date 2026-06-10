import { fireEvent, render, screen } from '@testing-library/react'
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
