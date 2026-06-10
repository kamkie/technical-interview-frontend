import {
  getSortDirection,
  type CatalogQueryState,
  type SortField,
} from '../catalog/catalogQuery'

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
  const direction = getSortDirection(query, field)
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
        onClick={() => onSortByField(field)}
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
