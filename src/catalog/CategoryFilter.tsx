import { useMemo, useState } from 'react'

import type { Category } from '../api/catalog'
import { useI18n } from '../i18n/useI18n'
import { getLoadErrorMessage, type LoadState } from '../ui/asyncState'
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
  const { t } = useI18n()
  // The search text is presentation-only state: it narrows the rendered
  // chips without ever entering the URL, while selected categories keep the
  // repeated `category` query contract owned by the page.
  const [searchText, setSearchText] = useState('')
  const namedCategories = useMemo(
    () =>
      categories.filter(
        (category): category is Category & { name: string } =>
          Boolean(category.name),
      ),
    [categories],
  )
  const normalizedSearch = searchText.trim().toLowerCase()
  // Selected chips always stay visible so the search can never hide an
  // active filter.
  const visibleCategories = namedCategories.filter(
    (category) =>
      selectedCategories.includes(category.name) ||
      category.name.toLowerCase().includes(normalizedSearch),
  )
  const noSearchMatches =
    normalizedSearch !== '' &&
    !namedCategories.some((category) =>
      category.name.toLowerCase().includes(normalizedSearch),
    )

  return (
    <div className="category-filter" aria-label={ariaLabel}>
      {categoriesState.status === 'loading' && (
        <StateMessage variant="loading">{t('ui.catalog.categories-loading')}</StateMessage>
      )}

      {categoriesState.status === 'error' && (
        <StateMessage variant="error">
          {getLoadErrorMessage(t, categoriesState)}
        </StateMessage>
      )}

      {categoriesState.status === 'ready' && namedCategories.length === 0 && (
        <StateMessage variant="empty">{t('ui.catalog.categories-empty')}</StateMessage>
      )}

      {namedCategories.length > 0 && (
        <input
          aria-label={t('ui.catalog.category-search-label')}
          className="category-search-input"
          placeholder={t('ui.catalog.category-search-placeholder')}
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      )}

      <div className="category-chip-row">
        {visibleCategories.map((category) => {
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

        {noSearchMatches && (
          <StateMessage variant="empty">
            {t('ui.catalog.categories-no-match')}
          </StateMessage>
        )}
      </div>
    </div>
  )
}
