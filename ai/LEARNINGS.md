# Learnings

> **Artifact role:** Learnings (lifecycle spec §7). **Activity owner:** `Capture-Learning` (§3.11) and the `Capture-Learning` cross-cutting trigger (§6).

This file holds **durable, repo-wide engineering lessons** that should survive refactors and onboarding turnover. It is not a changelog and not a journal.

## Capture Criteria

Add an entry only when a lesson satisfies **all** of:

- it is repo-wide, not feature-specific
- it would prevent a recurrence of a real bug, near-miss, or wasted effort
- it is not already enforced by a spec, test, or rule in `AGENTS.md`

If the lesson is enforceable, prefer adding a test, lint rule, or spec entry instead.

## Entry Format

```
### <short title>

- **What we learned:** <one sentence>
- **Why it matters:** <impact if forgotten>
- **What to do:** <concrete action or check>
- **Source:** <plan / incident / PR link, optional>
```

## Entries

TODO: add the first entry when one is captured. Until then, leave this section empty rather than filling it with generic advice.

## Maintenance

- review during the `Retrospect` activity (`ROADMAP.md` Continuous Improvement)
- delete entries that have been promoted into spec, test, or rule (record the promotion in the deleting commit)
- never archive raw incident logs here — link them instead
