import { useMemo } from 'react'

import type { Category } from '../api/catalog'
import type { LoadState } from '../ui/asyncState'

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
        <p className="session-message" role="status">
          Loading categories...
        </p>
      )}

      {categoriesState.status === 'error' && (
        <p className="session-message error" role="alert">
          {categoriesState.message}
        </p>
      )}

      {categoriesState.status === 'ready' && namedCategories.length === 0 && (
        <p className="session-message muted">No categories available.</p>
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
