---
name: cp
description: Stages changes and creates semantic, focused commits with clear why-focused body text, then pushes the current branch. Use when the user asks to commit and push, says cp, or wants to publish local work.
---

# cp

## Purpose

Run a safe commit-and-push flow for this repository.

## Defaults

- Prefer semantic, focused commits over a single monolithic commit.
- Stage per semantic unit (not always `git add -A` once).
- Do not run extra pre-flight verification in this skill by default; rely on the repository's pre-commit hook.
- If schema or migration files changed, run `just migrate-test` before the first commit attempt so test DB schema matches the new code.

## Workflow

1. Verify current branch with `git branch --show-current`.
2. Review changes with `git status`, `git diff`, and recent commit style (`git log`).
3. If DB schema/migration files changed (for example `src/server/db/schema.ts` or `drizzle/**`), run `just migrate-test`.
4. Group files into semantic units.
5. For each semantic unit:
    - Stage only relevant files/hunks.
    - Write a commit message with:
        - Subject line (concise, action-oriented).
        - Body that explains why the change exists and user impact.
    - Commit with a multi-line message (HEREDOC preferred).
    - If commit is blocked by formatting checks, run `just format`, restage affected files, and retry the same commit once.
6. Rebase before push:
    - Fetch latest remote refs: `git fetch origin`
    - Rebase current branch onto its remote tracking branch (or `origin/<branch>` if unset).
    - If conflicts occur, stop and report conflicted files plus suggested next resolution steps.
7. Sync dependencies and database after rebase:
    - Run `pnpm install` to ensure lockfile and `node_modules` match the rebased branch.
    - Run `just migrate` to apply pending development migrations.
    - Run `just migrate-test` to apply pending test database migrations used by hooks/tests.
    - If any of these fail, stop and report the exact failing command and output.
8. Push:
    - If no upstream: `git push -u origin HEAD`
    - Else: `git push`

## Semantic Commit Decomposition

When there are multiple kinds of changes, split by intent and blast radius. Use these rules:

1. **Primitive/API changes first**
    - New/changed UI primitives, hooks, shared utilities.
2. **Feature usage changes second**
    - Pages/components consuming those primitives.
3. **Layout/chrome/refactor changes separately**
    - Route-group moves, layout width/container updates, structure-only refactors.
4. **Avoid mixing unrelated concerns**
    - Do not mix behavior + styling + file moves in one commit unless tightly coupled.
5. **Keep each commit reversible**
    - A commit should be understandable and safe to revert alone.

### Example split

Given a change set containing:

- meter behavior updates,
- tooltip primitive introduction,
- classroom layout margin/width changes,

create 3 commits:

1. `feat(ui): add typed meter display modes`
2. `feat(ui): introduce tooltip primitive and wire inline meter hover details`
3. `refactor(classroom): adjust layout/container width behavior`

## Commit Message Rules

- Include meaningful why-context in the body.
- Avoid empty or one-line commits when context is needed.
- Keep message factual and user-relevant.
- Prefer one intent per commit.

## Safety Rails

- Never use `--no-verify`.
- Never use force-push in this skill unless user explicitly asks.
- If commit fails because of formatting, automatically run `just format`, restage, and retry commit once.
- If commit still fails after that retry (or fails for a non-formatting reason), stop and report the failing step and output.
- If commit or push fails, report the exact failure and next step.
