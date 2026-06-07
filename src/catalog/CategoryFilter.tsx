import { useMemo } from 'react'

import type { Category } from '../api/catalog'
import type { LoadState } from '../ui/asyncState'
import { StateMessage } from '../ui/StateBlock'

export function CategoryFilter({
  ariaLabel,
  categories,
  categoriesState,
  onToggleCategory,
  selectedCategories,
}: {
  ariaLabel: string
  categories: readonly Category[]
  categoriesState: LoadState<Category[]>
  onToggleCategory: (categoryName: string) => void
  selectedCategories: readonly string[]
}) {
  const namedCategories = useMemo(
    () =>
      categories.filter(
        (category): category is Category & { name: string } =>
          Boolean(category.name),
      ),
    [categories],
  )

  return (
    <div className="category-filter" aria-label={ariaLabel}>
      {categoriesState.status === 'loading' && (
        <StateMessage variant="loading">Loading categories...</StateMessage>
      )}

      {categoriesState.status === 'error' && (
        <StateMessage variant="error">{categoriesState.message}</StateMessage>
      )}

      {categoriesState.status === 'ready' && namedCategories.length === 0 && (
        <StateMessage variant="empty">No categories available.</StateMessage>
      )}

      {namedCategories.map((category) => {
        const selected = selectedCategories.includes(category.name)

        return (
          <button
            aria-pressed={selected}
            className={`category-chip ${selected ? 'selected' : ''}`}
            key={category.id ?? category.name}
            type="button"
            onClick={() => onToggleCategory(category.name)}
          >
            {category.name}
          </button>
        )
      })}
    </div>
  )
}
