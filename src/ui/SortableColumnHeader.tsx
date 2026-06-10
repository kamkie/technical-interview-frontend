import {
  getSortDirection,
  type CatalogQueryState,
  type SortDirection,
  type SortField,
} from '../catalog/catalogQuery'

export function SortToggleHeader({
  direction,
  label,
  onSort,
}: {
  direction: SortDirection | undefined
  label: string
  onSort: () => void
}) {
  const ariaSort =
    direction === 'ASC' ? 'ascending' : direction === 'DESC' ? 'descending' : 'none'
  const indicator =
    direction === 'ASC' ? 'ascending' : direction === 'DESC' ? 'descending' : 'not sorted'
  const nextDirectionLabel = direction === 'ASC' ? 'descending' : 'ascending'
  const sortButtonLabel = `Sort by ${label}; currently ${indicator}. Activate to sort ${nextDirectionLabel}.`

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
