# AI Review Reference

This file owns AI-facing review triggers for code review, spec drift, documentation drift, and security review. Use it when asked to review changes or when implementing work that crosses an owner boundary.

## Review Posture

For a review request, lead with findings ordered by severity. Each actionable finding should include a file and line reference, the risk, and the smallest useful fix direction. If no issues are found, say so and still report residual validation, smoke, or contract gaps.

For implementation work, run the relevant review triggers before handoff so drift is caught while the diff is still small.

## Code-Review Triggers

Review for bug risk when a change touches:

- API client behavior, generated types, request construction, response parsing, or error handling
- session bootstrap, login-provider rendering, logout, route guards, CSRF handling, or localization branching
- React Router query-state behavior, pagination, repeated filters, or sorting
- admin/operator/account flows, access-controlled surfaces, or optimistic updates
- shared fixtures, mocks, test utilities, package scripts, or workflow gates

Check that tests cover the changed visible states at the smallest useful layer and that API-facing behavior still follows the imported backend contract.

## Spec-Drift Triggers

Check for spec drift when behavior changes a selected user flow, access rule, visible state, error state, filter, sorting behavior, or admin/operator surface.

Use `docs/specs/` when the intended behavior is too broad or ambiguous for a roadmap row. Do not encode endpoint fields, request schemas, or durable API rules in a frontend spec when the imported backend contract already owns them.

## Documentation-Drift Triggers

Check for documentation drift when a change affects:

- setup commands, local troubleshooting, or package manager/runtime expectations
- validation commands, hardening checks, smoke coverage, or release preconditions
- roadmap milestone status, release phase, deferred scope, or selected product scope
- human AI guidance or AI procedure references
- user-visible release-candidate history

Use `.agents/references/documentation.md` to find the owner and alignment files.

## Security-Review Triggers

Run a security-focused review when a change touches:

- session, auth, logout, CSRF, access guards, or role-dependent UI
- user-controlled URLs, redirects, query strings, or external links
- HTML insertion, markdown rendering, localization rendering, or any path that could expose unescaped content
- persisted browser state, cookies, storage, or request credentials
- dependency changes, package scripts, workflow permissions, or hardening gates
- release metadata or publication steps that could mislabel an artifact

For API-facing security questions, keep the frontend same-origin and session-cookie based. Do not add CORS-dependent behavior, JWT assumptions, bearer-token assumptions, hard-coded OAuth provider paths, or alternate transports.

## Hardening Triage

For selected M13 hardening gates:

- Workflow permission and concurrency changes should be reviewed for least privilege, no unexpected write scopes, and no concurrency rule that cancels protected branch or release/tag evidence. Pull-request runs may cancel superseded runs.
- CodeQL alerts should be treated as actionable until the relevant data or control flow is understood. Use GitHub code scanning alerts and CodeQL workflow logs as the report locations. Prefer source fixes; use a scoped exception only when the alert is demonstrably not exploitable or cannot be fixed before the selected release.
- Dependency-review and npm audit failures should be fixed through dependency updates, lockfile refreshes, or a package replacement where practical. Use pull-request checks, annotations, workflow logs, and `npm run audit:security` output as the report locations. In private-repository advisory mode, treat unsupported dependency-review runs as a signal to rely on npm audit until dependency graph and GitHub Advanced Security support are enabled. Exceptions must name the advisory, package path, owner, mitigation, expiration or revisit trigger, and release decision.
- Dependabot grouping should reduce review noise without hiding security updates. Do not require named individual reviewers until the repository owns a stable reviewer team or `CODEOWNERS`.
- A skipped or disabled hardening check must have a scoped rationale and an owner. Do not raise the global audit threshold or disable the entire workflow for one finding.

## Review Handoff

A review handoff should include:

- findings first, or a clear statement that no actionable issues were found
- open questions or assumptions
- validation and smoke gaps
- a short change summary only after findings
