import {
  getSortDirection,
  type CatalogQueryState,
  type SortDirection,
  type SortField,
} from '../catalog/catalogQuery'
import { useI18n } from '../i18n/useI18n'

export function SortToggleHeader({
  direction,
  label,
  onSort,
}: {
  direction: SortDirection | undefined
  label: string
  onSort: () => void
}) {
  const { t } = useI18n()
  const ariaSort =
    direction === 'ASC' ? 'ascending' : direction === 'DESC' ? 'descending' : 'none'
  const indicator =
    direction === 'ASC'
      ? t('ui.sort.ascending')
      : direction === 'DESC'
        ? t('ui.sort.descending')
        : t('ui.sort.not-sorted')
  const nextDirectionLabel =
    direction === 'ASC' ? t('ui.sort.descending') : t('ui.sort.ascending')
  const sortButtonLabel = t('ui.sort.button-label', {
    label,
    indicator,
    direction: nextDirectionLabel,
  })

  return (
    <th aria-sort={ariaSort} scope="col">
      <button
        aria-label={sortButtonLabel}
        className="column-sort-button"
        type="button"
        onClick={onSort}
      >
        <span>{label}</span>
        <span
          className={`sort-indicator ${direction ? 'sorted' : ''}`}
          aria-hidden="true"
        >
          {direction === 'ASC' ? '↑' : direction === 'DESC' ? '↓' : '↕'}
        </span>
        <span className="visually-hidden">{indicator}</span>
      </button>
    </th>
  )
}

export function SortableColumnHeader({
  field,
  label,
  onSortByField,
  query,
}: {
  field: SortField
  label: string
  onSortByField: (field: SortField) => void
  query: CatalogQueryState
}) {
  return (
    <SortToggleHeader
      direction={getSortDirection(query, field)}
      label={label}
      onSort={() => onSortByField(field)}
    />
  )
}
