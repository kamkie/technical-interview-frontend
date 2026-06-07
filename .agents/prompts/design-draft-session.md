# Design Draft Session

Explore frontend UI drafts, screenshots, visual variants, or state coverage before implementation.

## Read First

- `AGENTS.md`
- `.agents/references/documentation.md`
- `.agents/references/code-style.md`
- `docs/DESIGN.md`
- `.agents/prompts/README.md`
- this prompt
- the named draft file, image attachment, screenshot, roadmap ref, spec, or design note from the user request

Load production source, tests, backend contract artifacts, active plans, or roadmap rows only when the user explicitly connects the draft to implementation or selected scope.

## Output

Produce a design-session report with:

- source prompt, permission boundary, and whether the session is design-only
- draft files, screenshots, routes, or images inspected
- variants created or changed, with file paths
- state coverage checked, such as loading, empty, error, success, disabled, narrow viewport, desktop viewport, authenticated, anonymous, admin, and operator states
- visual risks, including design intent mismatch, workflow hierarchy, spacing, table density, action placement, responsive behavior, color, focus, or text-fitting issues
- recommendation for the selected draft or the next design pass
- validation run, or the reason validation was deferred

When the user explicitly asks for a design-only session, keep changes limited to draft artifacts and do not run broad validation until the user ends that mode or asks for checks.

## Non-Goals

- Do not implement production UI from drafts unless the user separately asks.
- Do not update roadmap status, plan status, specs, or backend contract behavior from visual preference alone.
- Do not treat generated or drafted visuals as final production assets without an implementation pass.
- Do not run broad repository validation during a design-only session unless the user asks.
