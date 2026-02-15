---
name: gha-debug
description: Investigates failed GitHub Actions runs using gh CLI, identifies root cause from failing jobs and logs, and suggests concrete fixes and rerun steps. Use when CI fails, checks are red, or the user asks to debug GitHub Actions.
---

# gha-debug

## Purpose

Debug failed GitHub Actions runs quickly and produce an actionable fix plan.

## Workflow

1. Confirm context:
    - branch: `git branch --show-current`
    - recent runs: `gh run list --limit 10`
2. Identify the failing run:
    - If user gave a run URL/ID, use it.
    - Otherwise pick the latest failed run for current branch.
3. Inspect failures:
    - `gh run view <run-id> --jobs`
    - `gh run view <run-id> --log-failed`
4. Summarize:
    - failing workflow/job/step
    - first actionable error message
    - likely root cause category (format/lint/type/test/e2e/env/permissions)
5. Reproduce locally:
    - run the closest local command(s), default: `just pre-flight`
6. Propose fix:
    - smallest safe change
    - exact file(s)/command(s) to update
7. After applying fix:
    - re-run local checks
    - re-run CI via push or `gh run rerun <run-id>` if appropriate

## Common Commands

- List runs: `gh run list --limit 20`
- View run: `gh run view <run-id>`
- View jobs: `gh run view <run-id> --jobs`
- Failed logs: `gh run view <run-id> --log-failed`
- Download artifacts: `gh run download <run-id>`
- Rerun failed jobs: `gh run rerun <run-id> --failed`

## Safety Rails

- Do not guess missing logs; always quote real failing output.
- Prefer minimal fixes over broad refactors.
- If failure is secrets/permissions-related, stop and ask user before changing repo settings.
- If failure cannot be reproduced locally, state that clearly and list likely environmental causes.
