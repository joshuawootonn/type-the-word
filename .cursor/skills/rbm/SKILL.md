---
name: rbm
description: Rebases the current branch onto another branch with intent-aware preparation and conservative conflict handling. Use when the user asks to rebase, says rbm, or wants to sync a feature branch with a target branch.
---

# rbm

## Purpose

Rebase current work onto a target branch safely, with smart context gathering and strict guardrails.

## Defaults

- Intended for non-`main` feature branches.
- Gather intent from commit history and diffs before rebasing.
- On conflicts, stop and ask user (do not auto-resolve).
- After successful history rewrite on non-`main`, auto-push with `--force-with-lease`.

## Workflow

1. Confirm:
    - current branch (`git branch --show-current`) is not `main`
    - target branch is provided by user
2. Check cleanliness with `git status`.
    - If dirty, ask user whether to stash/commit first.
3. Gather intent context:
    - `git log --oneline <target>...HEAD`
    - `git diff <target>...HEAD`
    - If available, review related PR title/body for branch intent
4. Sync refs:
    - `git fetch origin`
5. Rebase onto target:
    - Prefer `git rebase origin/<target>`
    - Use `--onto` only when user asks or topology requires it
6. If conflicts occur:
    - Stop immediately
    - Report conflicting files and conflict summary
    - Ask user how to resolve before continuing
7. If rebase succeeds and branch is non-`main`:
    - `git push --force-with-lease`

## Safety Rails

- Never run rebase on `main`.
- Never auto-resolve merge conflicts.
- Never use plain `--force`; use only `--force-with-lease`.
- If branch protection rejects force-push, stop and ask user.
