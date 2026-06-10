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
  pageSizeOptions,
  querySize,
  totalPages,
  variant = 'pager',
}: {
  ariaLabel: string
  disabled?: boolean
  first: boolean
  last: boolean
  onNextPage: () => void
  onPageSizeChange: (size: number) => void
  onPreviousPage: () => void
  pageNumber: number
  pageSizeOptions: readonly number[]
  querySize: number
  totalPages: number
  variant?: 'pager' | 'toolbar'
}) {
  const pageStatus = `Page ${pageNumber + 1}${
    totalPages > 0 ? ` of ${totalPages}` : ''
  }`

  // The toolbar variant sits in the one-line table toolbar and owns the
  // rows-per-page select; the bottom pager only steps through pages.
  if (variant === 'toolbar') {
    return (
      <div className="pagination-controls toolbar" aria-label={ariaLabel}>
        <span>{pageStatus}</span>
        <label className="inline-page-size">
          <span>Rows per page</span>
          <select
            disabled={disabled}
            value={querySize}
            onChange={(event) =>
              onPageSizeChange(Number(event.currentTarget.value))
            }
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
          aria-label="Previous page"
          type="button"
          disabled={disabled || first}
          onClick={onPreviousPage}
        >
          <IconChevronLeft height={15} width={15} />
        </button>
        <button
          aria-label="Next page"
          type="button"
          disabled={disabled || last}
          onClick={onNextPage}
        >
          <IconChevronRight height={15} width={15} />
        </button>
      </div>
    )
  }

  return (
    <div className="pagination-controls" aria-label={ariaLabel}>
      <span>{pageStatus}</span>
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
