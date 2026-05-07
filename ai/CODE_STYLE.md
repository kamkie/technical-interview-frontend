# Code Style

> **Activity owner:** input to the `Code` activity (lifecycle spec §3.4). **Conditional descriptive guide:** load only when editing source files.

Style rules consumed by Implementers. Keep this file short and enforceable; prefer formatter / linter configuration over prose.

## Sources Of Truth

- formatter config: TODO: file path (e.g. `.editorconfig`, `prettier.config`, `.scalafmt.conf`, `pyproject.toml [tool.black]`)
- linter config: TODO: file path
- import / module ordering: TODO

If this file disagrees with the configured formatter / linter, the formatter / linter wins. Update this file in the same change.

## Repo-Wide Conventions

- **Smallest diff first.** Match the existing surrounding style; do not opportunistically reformat unrelated files.
- **Naming.** Follow the language's idiomatic conventions and the existing repo conventions.
- **Comments.** Match the surrounding frequency. Do not add comments where the codebase has none, unless the user explicitly asks for them.
- **Files.** Follow existing naming (casing, separators, prefixes). Sequentially numbered files keep continuous numbering.
- **Public API.** Public-facing names belong in published contract artifacts; do not rename them outside a public-behavior change-class (`AGENTS.md` *Change-Class Table*).

## Language-Specific Notes

TODO: per-language sub-section. Examples:

### TODO: <Language A>

- TODO: notable rules

### TODO: <Language B>

- TODO: notable rules

## Anti-Patterns

- bulk reformatting alongside a behavior change
- adding new style rules that are not enforced by the formatter / linter
- leaving commented-out code or `TODO`s without an owner
