---
name: pr
description: Creates a repository-aligned pull request using gh CLI with template-aware body content and a draft-to-main default. Use when the user asks to open a PR, says pr, or wants to submit branch changes for review.
---

# pr

## Purpose

Create a high-quality PR for this repo with mandatory local preflight checks.

## Defaults

- Default PR mode: Draft.
- Default base branch: `main`.
- Use repository PR template if present.
- Always run `just pre-flight` before opening the PR.

## Workflow

1. Confirm current branch is not `main` with `git branch --show-current`.
2. Inspect state with:
    - `git status`
    - `git log --oneline main...HEAD`
    - `git diff main...HEAD`
3. Run preflight checks: `just pre-flight`.
4. Ensure changes are committed before opening PR.
5. Find PR template:
    - `.github/pull_request_template.md`
    - `.github/PULL_REQUEST_TEMPLATE.md`
    - `.github/PULL_REQUEST_TEMPLATE/*`
6. Draft PR body by combining template structure with branch changes:
    - concise summary
    - why/context
    - test notes
    - linked issues when available
7. Push branch if needed: `git push -u origin HEAD`.
8. Create PR with `gh pr create` using:
    - `--draft`
    - `--base main`
    - `--head <current-branch>`
    - `--title ...`
    - `--body-file ...` or HEREDOC-based body

## Safety Rails

- Never open a PR from `main` branch.
- Preserve template headings/checklists where they exist.
- If `just pre-flight` fails, stop and report the failing step and output.
- Do not claim checks were run unless actually run.
- If gh auth/permissions fail, report the exact blocker and command to fix.
