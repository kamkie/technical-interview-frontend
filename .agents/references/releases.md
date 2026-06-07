# AI Release Reference

This file owns AI-facing release sequencing, version choice, annotated tags, changelog promotion, package checks, GHCR package publication, GitHub Release verification, and post-release roadmap cleanup for the frontend repository.

Release work is maintainer-owned. Do not create commits, tags, pushes, or published releases unless the current user request or active plan explicitly authorizes that specific action. Remote publication requires explicit current authorization.

## Preconditions

Before preparing a release, confirm:

- the intended implementation scope is complete, reviewed, and integrated on `main`
- local `main` is synced to the exact release-candidate state
- backend contract artifacts and generated API types are current, or any intentional refresh is already reviewed
- `CHANGELOG.md`, `ROADMAP.md`, `README.md`, `SETUP.md`, package metadata, and validation evidence describe the same candidate
- the full validation baseline passed for the exact candidate
- `npm run docker:build` passed for the exact candidate, or local Docker unavailability is explicitly recorded before relying on the tag-driven Release workflow for container evidence
- selected M13 hardening checks have passed when they exist, or each exception has an owner and release decision
- browser smoke evidence is recorded, or unavailable authenticated smoke is called out with the reason

## M13 Hardening Evidence

After M13-B lands, release preparation must capture:

- the full validation baseline for the exact release candidate
- `npm run audit:security` passing at the selected high-or-critical advisory threshold
- successful CI-owned CodeQL and dependency-review signals for the release-candidate commit, or a documented reason a CI-only signal was advisory-only or unavailable
- current workflow configuration showing explicit permissions and concurrency
- any scoped exception with the finding/advisory, affected package or path, owner, mitigation or planned fix, expiration or revisit trigger, and release decision

Dependabot configuration is release-readiness evidence that dependency maintenance is owned. Dependabot PR creation is not itself a release-blocking command, but a high-or-critical security update tied to a selected audit/dependency-review failure must be resolved or explicitly excepted before release.

## Version Choice

Use semantic version tags:

- `vMAJOR.MINOR.PATCH` for stable releases
- `vMAJOR.MINOR.PATCH-PRERELEASE` for prereleases

Choose `PATCH` for compatible fixes or cleanup, `MINOR` for backward-compatible frontend feature expansion, and `MAJOR` only for an explicitly selected breaking change. Keep versions increasing in first-parent history order.

## Release Sequence

1. Inspect current state with `git status --short`, `git branch --show-current`, `git tag --sort=v:refname`, and first-parent history.
2. Stop if the release would include unrelated dirty work or is not being cut from synced `main`.
3. Promote release-relevant `CHANGELOG.md` entries from `## [Unreleased]` into a dated `## [VERSION] - YYYY-MM-DD` section, leaving a fresh `## [Unreleased]`.
4. Verify `package.json` and `package-lock.json` versions match the selected release.
5. Build the release container locally with `npm run docker:build` when Docker is available, and record any accepted environment limitation when it is not.
6. Update `ROADMAP.md` so release phase, latest release, next target version, immediate action, milestone statuses, and deferred scope agree with the release.
7. Re-run required validation if metadata edits made earlier evidence stale.
8. When commit authorization exists, commit release metadata as `Prepare vMAJOR.MINOR.PATCH[-PRERELEASE] release`.
9. When tag authorization exists, create an annotated tag named `vMAJOR.MINOR.PATCH[-PRERELEASE]` with annotation `Release vMAJOR.MINOR.PATCH[-PRERELEASE]`.
10. Verify the tag points at the release commit and `git status --short` is clean except for explicitly excluded user-owned files.

## Publication And Cleanup

Push `main`, push tags, publish container packages, or publish release notes only when the current task explicitly asks for remote publication.

For release tags whose commit contains `.github/workflows/release.yml`, the tag-driven `Release` workflow is expected to:

- run the full frontend validation baseline plus `npm run audit:security`
- build and smoke-test the Docker image
- publish `ghcr.io/<owner>/<repo>:vMAJOR.MINOR.PATCH[-PRERELEASE]` and `ghcr.io/<owner>/<repo>:sha-<12-char-commit>`
- verify both tags resolve to the same immutable digest
- sign the digest with Cosign `v3.0.5` using the workflow identity
- publish a GitHub provenance attestation for the digest
- render release notes from `CHANGELOG.md` using `scripts/release/render-release-notes.ps1`
- create the GitHub Release with the container image, immutable image, and package page references

After publication, verify release notes match the released changelog section and use the immutable digest from the workflow summary as the authenticity anchor, not a mutable GHCR tag alone.

For manual verification, use the same Cosign line as the workflow:

```powershell
docker run --rm ghcr.io/sigstore/cosign/cosign:v3.0.5 verify `
  ghcr.io/<owner>/<repo>@sha256:<digest> `
  --certificate-identity "https://github.com/<owner>/<repo>/.github/workflows/release.yml@refs/tags/vMAJOR.MINOR.PATCH[-PRERELEASE]" `
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

Verify provenance with:

```powershell
gh attestation verify oci://ghcr.io/<owner>/<repo>@sha256:<digest> `
  --repo <owner>/<repo> `
  --signer-workflow <owner>/<repo>/.github/workflows/release.yml `
  --source-ref refs/tags/vMAJOR.MINOR.PATCH[-PRERELEASE]
```

Post-release roadmap cleanup should:

- move completed work out of the active roadmap view
- update latest release, next target version, release phase, and immediate action
- leave active, waiting, and deferred work visible
- avoid creating another durable released-history file; shipped history belongs in `CHANGELOG.md`
