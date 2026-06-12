import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Category } from '../api/catalog'
import { CategoryFilter } from './CategoryFilter'

const CATEGORIES: readonly Category[] = [
  { id: 1, name: 'Architecture' },
  { id: 2, name: 'Java' },
  { id: 3, name: 'Testing' },
]

function renderFilter(selectedCategories: readonly string[] = []) {
  const onToggleCategory = vi.fn()

  render(
    <CategoryFilter
      ariaLabel="Category filters"
      categories={CATEGORIES}
      categoriesState={{ status: 'ready', value: [...CATEGORIES] }}
      selectedCategories={selectedCategories}
      onToggleCategory={onToggleCategory}
    />,
  )

  return onToggleCategory
}

describe('CategoryFilter', () => {
  it('narrows the rendered chips by typing into the search input', () => {
    renderFilter()

    expect(screen.getByRole('button', { name: 'Java' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Testing' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Search categories'), {
      target: { value: 'jav' },
    })

    expect(screen.getByRole('button', { name: 'Java' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Testing' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Architecture' })).toBeNull()
  })

  it('keeps selected chips visible when the search text does not match them', () => {
    renderFilter(['Testing'])

    fireEvent.change(screen.getByLabelText('Search categories'), {
      target: { value: 'jav' },
    })

    const selectedChip = screen.getByRole('button', { name: 'Testing' })

    expect(selectedChip).toBeInTheDocument()
    expect(selectedChip).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Java' })).toBeInTheDocument()
  })

  it('shows a no-match state when no category matches the search', () => {
    renderFilter()

    fireEvent.change(screen.getByLabelText('Search categories'), {
      target: { value: 'nonexistent' },
    })

    expect(
      screen.getByText('No categories match this search.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Java' })).toBeNull()
  })

  it('still toggles a chip selected through the page-owned category contract', () => {
    const onToggleCategory = renderFilter()

    fireEvent.change(screen.getByLabelText('Search categories'), {
      target: { value: 'java' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Java' }))

    expect(onToggleCategory).toHaveBeenCalledWith('Java')
  })
})
