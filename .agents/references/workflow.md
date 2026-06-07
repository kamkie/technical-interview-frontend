# AI Workflow Reference

This file owns delegation mechanics and role expectations for AI work in this frontend repository. Use it when coordinating planners, implementation workers, reviewers, verifiers, or active-plan slices.

## Role Model

- Coordinator: owns the user request, repository-state checks, task scoping, worker prompts, shared-file sequencing, integration acceptance, status and checkpoint updates, and final handoff.
- Planning worker: converts a requested change into a narrow handoff with objective, source documents, proposed file ownership, implementation steps, validation, risks, open questions, and non-goals.
- Implementation worker: edits only the assigned files, preserves user-owned changes, runs scoped validation, and returns changed files, validation, skipped checks, and remaining risks.
- Reviewer: checks the completed diff for bugs, owner drift, contract drift, documentation drift, security risk, missing validation, and unhandled handoff obligations.
- Verifier: runs or confirms assigned validation and reports exact commands, results, environment limits, skipped checks, findings, and residual smoke or contract risk.

Research, exploration, and planning subagents are optional for ad hoc work. Use them when the coordinator needs clearer ownership, source review, implementation steps, or risk discovery before assignment.

Repository-changing implementation must be assigned to a separate implementation worker subagent with exact write scope, scoped validation, stop conditions, and handoff requirements. The coordinator may perform read-only coordination, research, planning, review, and final validation directly when the task allows it.

Active-plan work follows `.agents/references/plan-execution.md`; this reference applies only where it does not conflict with the active plan execution contract.

## Clean Verifier Rules

- Active plans may declare one dedicated clean verifier for one plan execution. Do not use more than one clean verifier for the same plan execution.
- Start the clean verifier without full thread history or forked conversation context. Send compact scoped prompts with repository path, current ref or commit, expected diff scope, assigned commands, review scope, stop conditions, and output format.
- Default clean verifier write scope is `read-only`. Assign artifact write scope only when the plan explicitly names it.
- Before review or validation, the verifier must confirm the current worktree state, ref or commit, and diff it can see. Do not use verifier evidence when the verifier cannot see the current integrated state.
- The verifier may run or confirm validation and review diffs for bugs, owner drift, contract drift, documentation drift, security-review triggers, and scope leaks.
- The coordinator still owns dispatch, dirty-worktree protection, shared-file sequencing, resolving findings, integration acceptance, status, plan, roadmap, or owner-document edits, checkpoint commits, and final handoff.

## Delegation Rules

- Do not spawn subagents with full thread history. Keep `fork_context` disabled or omitted.
- Give each worker a complete scoped prompt with repository path, relevant instructions, read-only context, exact write scope, validation requirements, stop conditions, and output format.
- Assign disjoint write scopes whenever multiple workers are active.
- Tell workers they are not alone in the codebase and that existing or unexpected changes are user-owned.
- Workers must run `git status --short` before editing and must stop if unexpected changes appear inside their assigned write scope.
- Workers must not edit outside their assigned write scope, even to fix nearby wording, formatting, imports, generated files, or roadmap status.
- Workers must not revert, rewrite, delete, normalize, or clean up another worker's or user's changes.
- Shared files belong to the coordinator unless explicitly assigned to one worker at a time.

## Prompt Read Sets

Coordinator prompts should include only the context needed for the slice:

- Root rules: `AGENTS.md` for entry gates and truth priority.
- Backend integration work: `docs/backend/approved-openapi.json`, `docs/backend/FRONTEND_AI_CONTRACT.md`, and `docs/backend/README.md`.
- Product or design work: `docs/DESIGN.md`, selected `ROADMAP.md` rows, and any relevant specs.
- Documentation routing: `.agents/references/documentation.md` and `.agents/references/references-rules.md`.
- Validation selection: `.agents/references/testing.md`.
- Review work: `.agents/references/reviews.md`.
- Roadmap work: `.agents/references/roadmap.md`.
- Active-plan work: the plan file and `.agents/references/plan-execution.md`.
- Active-plan clean verification: the plan file, current status/ref/diff, `.agents/references/plan-execution.md`, `.agents/references/testing.md`, and `.agents/references/reviews.md`.

Do not bulk-load AI guidance, generated contracts, source trees, archives, or unrelated reference files unless exact schema, code placement, owner detail, broad-audit scope, cross-document consistency, or validation failure triage requires it.

After compaction, resume, or summarized worker handoff, reload only the latest user request, `AGENTS.md`, and the most specific governing artifact for the next action before continuing.

## Worker Handoff Requirements

Every worker or verifier handoff should include:

- changed files
- confirmation that files outside the assigned write scope were not edited
- validation run and result
- skipped validation with reasons
- any unexpected dirty-worktree observations and how they were handled
- remaining risks, contradictions, or owner-drift concerns

Clean verifier handoffs must also confirm the exact worktree state, ref or commit, and diff reviewed before reporting evidence.

## Coordination Boundaries

Plans and worker prompts coordinate execution. Durable rules belong in the owning backend contract artifact, executable test, human doc, design guide, roadmap row, focused reference, or source file.

Do not add generic command wrappers, durable workflow-state directories, or new process scaffolds unless the roadmap or active plan selects a concrete need and assigns an owner.
