# M19 Public Catalog Workflow Polish Spec

## Scope

M19 polishes the already implemented anonymous public catalog workflow without changing backend endpoints, request fields, authentication, or transport behavior. The selected slice is route-state clarity plus scan and control affordances for the existing `/catalog` table.

## User-Visible Behavior

- Public catalog route query strings are canonicalized after parsing. Invalid page numbers, unsupported page sizes, unknown sort values, duplicate categories, blank repeated filters, and extra whitespace are replaced in the browser URL with the normalized query that the frontend uses for `GET /api/books`. The replacement does not add a new history entry.
- The catalog summary shows the current result window, total book count, active filters, active sort, and selected row count so users can understand the visible table state from the page, not only from the URL.
- The default catalog view explicitly says no filters are applied.
- Sortable table headers keep `aria-sort` and expose button names that include the current sort state and next action.
- Pagination and sorting continue to preserve Spring conventions: `page`, `size`, and repeated `sort` values for backend requests, with repeated `category` filters.

## Out Of Scope

- Backend contract refreshes or new backend-supported fields.
- CORS, JWT, bearer-token, or alternate transport behavior.
- Authenticated catalog management behavior.
- New visual design systems or broad app-wide layout changes.

## Validation

- Component and route tests cover canonical URL replacement, visible active query-state summary, sort control naming, empty/default states, and existing public catalog request serialization.
- App source changes use the full frontend validation baseline from `.agents/references/testing.md`.
