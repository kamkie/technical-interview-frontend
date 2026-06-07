# Bug Report Triage

Classify a reported frontend problem, identify the likely owner area, and choose the next safe work path before implementation.

## Read First

- `AGENTS.md`
- `.agents/references/testing.md`
- `.agents/references/troubleshooting.md`
- `.agents/references/reviews.md`
- `.agents/prompts/README.md`
- this prompt
- the bug report, screenshots, browser console output, network notes, validation output, roadmap ref, or affected file paths supplied by the user

Load source files, tests, backend contract artifacts, specs, plans, design docs, smoke notes, or local setup docs only when the report points to them or the likely owner area depends on them.

## Output

Return a triage note with:

- observed behavior and expected behavior
- triggering action, route, viewport, session state, backend profile, or browser context when known
- likely owner area: catalog, account, admin, operator, session/auth/CSRF, localization, routing/query state, API client, mock API, Docker/runtime, docs, or unknown
- repro status: reproduced, likely reproducible, insufficient information, or cannot reproduce locally
- missing information that would change the diagnosis
- whether the next step is direct one-off work, roadmap or spec update, active plan, smoke validation, backend contract check, local setup triage, or no repo change
- smallest useful investigation or fix path
- validation needed after the fix
- privacy or log-sanitization concerns, if any

If the user asks for implementation and the report is sufficiently scoped, proceed only when execution, roadmap, and owner-document gates are satisfied.

## Non-Goals

- Do not infer product decisions, support promises, or backend behavior from one bug report.
- Do not inspect unrelated local logs or credentials.
- Do not broaden a narrow bug report into unrelated cleanup.
- Do not create specs, roadmap items, or plans unless repository rules or the user request require them.
