import { IconChevronLeft, IconChevronRight } from './icons'

export function PaginationControls({
  ariaLabel,
  disabled = false,
  first,
  last,
  onNextPage,
  onPageSizeChange,
  onPreviousPage,
  pageNumber,
  pageSize,
  pageSizeOptions,
  querySize,
  rowsLabel = 'rows',
  totalPages,
}: {
  ariaLabel: string
  disabled?: boolean
  first: boolean
  last: boolean
  onNextPage: () => void
  onPageSizeChange: (size: number) => void
  onPreviousPage: () => void
  pageNumber: number
  pageSize: number
  pageSizeOptions: readonly number[]
  querySize: number
  rowsLabel?: string
  totalPages: number
}) {
  return (
    <div className="pagination-controls" aria-label={ariaLabel}>
      <span>
        Page {pageNumber + 1}
        {totalPages > 0 ? ` of ${totalPages}` : ''} - {pageSize} {rowsLabel}
      </span>
      <label className="inline-page-size">
        <span className="visually-hidden">Rows per page</span>
        <select
          disabled={disabled}
          value={querySize}
          onChange={(event) => onPageSizeChange(Number(event.currentTarget.value))}
        >
          {!pageSizeOptions.includes(querySize) && (
            <option value={querySize}>{querySize}</option>
          )}
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={disabled || first}
        onClick={onPreviousPage}
      >
        <IconChevronLeft height={15} width={15} />
        Previous
      </button>
      <button type="button" disabled={disabled || last} onClick={onNextPage}>
        Next
        <IconChevronRight height={15} width={15} />
      </button>
    </div>
  )
}
