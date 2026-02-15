---
name: pr
description: Creates a repository-aligned pull request using gh CLI with template-aware body content and a draft-to-main default. Use when the user asks to open a PR, says pr, or wants to submit branch changes for review.
---

# pr

## Purpose

Create a high-quality PR for this repo without extra prerelease/preflight assumptions.

## Defaults

- Default PR mode: Draft.
- Default base branch: `main`.
- Use repository PR template if present.
- Do not run manual preflight/lint/test commands unless user asks (git hooks handle checks on commit/push).

## Workflow

1. Confirm current branch is not `main` with `git branch --show-current`.
2. Inspect state with:
    - `git status`
    - `git log --oneline main...HEAD`
    - `git diff main...HEAD`
3. Ensure changes are committed before opening PR.
4. Find PR template:
    - `.github/pull_request_template.md`
    - `.github/PULL_REQUEST_TEMPLATE.md`
    - `.github/PULL_REQUEST_TEMPLATE/*`
5. Draft PR body by combining template structure with branch changes:
    - concise summary
    - why/context
    - test notes
    - linked issues when available
6. Push branch if needed: `git push -u origin HEAD`.
7. Create PR with `gh pr create` using:
    - `--draft`
    - `--base main`
    - `--head <current-branch>`
    - `--title ...`
    - `--body-file ...` or HEREDOC-based body

## Safety Rails

- Never open a PR from `main` branch.
- Preserve template headings/checklists where they exist.
- Do not claim checks were run unless actually run.
- If gh auth/permissions fail, report the exact blocker and command to fix.
