import { IconChevronLeft, IconChevronRight } from './icons'

// Constant-slot page window: the first and last pages stay visible and the
// slot count never changes while stepping, so the pager keeps a stable
// footprint. Page values are 1-based for display.
function pageWindow(
  currentPage: number,
  totalPages: number,
): Array<number | 'gap-start' | 'gap-end'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'gap-end', totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      'gap-start',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ]
  }

  return [
    1,
    'gap-start',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'gap-end',
    totalPages,
  ]
}

export function PaginationControls({
  ariaLabel,
  disabled = false,
  first,
  last,
  onNextPage,
  onPageChange,
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
  onPageChange?: (page: number) => void
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

  // While a refetch is in flight, buttons stay focusable with aria-disabled
  // and a click guard; a real disabled attribute would drop keyboard focus to
  // the body mid-refetch. Only the first/last boundaries hard-disable.

  // The toolbar variant sits in the one-line table toolbar and owns the
  // rows-per-page select; the bottom pager only steps and jumps pages.
  if (variant === 'toolbar') {
    return (
      <div className="pagination-controls toolbar" aria-label={ariaLabel}>
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
          aria-disabled={disabled || undefined}
          aria-label="Previous page"
          type="button"
          disabled={first}
          onClick={() => {
            if (!disabled) {
              onPreviousPage()
            }
          }}
        >
          <IconChevronLeft height={15} width={15} />
        </button>
        <button
          aria-disabled={disabled || undefined}
          aria-label="Next page"
          type="button"
          disabled={last}
          onClick={() => {
            if (!disabled) {
              onNextPage()
            }
          }}
        >
          <IconChevronRight height={15} width={15} />
        </button>
      </div>
    )
  }

  // The bottom pager renders numbered pages for direct jumps when the page
  // window is known; otherwise it degrades to a plain stepper with status.
  if (totalPages > 0 && onPageChange) {
    const currentPage = pageNumber + 1

    return (
      <nav className="pagination-controls pager" aria-label={ariaLabel}>
        <button
          aria-disabled={disabled || undefined}
          aria-label="Previous page"
          type="button"
          disabled={first}
          onClick={() => {
            if (!disabled) {
              onPreviousPage()
            }
          }}
        >
          <IconChevronLeft height={15} width={15} />
        </button>
        {pageWindow(currentPage, totalPages).map((slot) =>
          typeof slot === 'number' ? (
            <button
              aria-current={slot === currentPage ? 'page' : undefined}
              aria-disabled={disabled || undefined}
              aria-label={`Page ${slot}`}
              key={slot}
              type="button"
              onClick={() => {
                if (!disabled && slot !== currentPage) {
                  onPageChange(slot - 1)
                }
              }}
            >
              {slot}
            </button>
          ) : (
            <span aria-hidden="true" className="page-gap" key={slot}>
              …
            </span>
          ),
        )}
        <button
          aria-disabled={disabled || undefined}
          aria-label="Next page"
          type="button"
          disabled={last}
          onClick={() => {
            if (!disabled) {
              onNextPage()
            }
          }}
        >
          <IconChevronRight height={15} width={15} />
        </button>
      </nav>
    )
  }

  return (
    <nav className="pagination-controls pager" aria-label={ariaLabel}>
      <button
        aria-disabled={disabled || undefined}
        aria-label="Previous page"
        type="button"
        disabled={first}
        onClick={() => {
          if (!disabled) {
            onPreviousPage()
          }
        }}
      >
        <IconChevronLeft height={15} width={15} />
      </button>
      <span>{pageStatus}</span>
      <button
        aria-disabled={disabled || undefined}
        aria-label="Next page"
        type="button"
        disabled={last}
        onClick={() => {
          if (!disabled) {
            onNextPage()
          }
        }}
      >
        <IconChevronRight height={15} width={15} />
      </button>
    </nav>
  )
}
