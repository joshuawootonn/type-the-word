---
name: cp
description: Stages all changes, creates a high-quality commit with clear why-focused body text, and pushes the current branch. Use when the user asks to commit and push, says cp, or wants to publish local work to a non-main branch.
---

# cp

## Purpose

Run a safe commit-and-push flow for this repository.

## Defaults

- Auto-stage all files with `git add -A`.
- Target non-`main` branches.
- Always run `just pre-flight` before committing.

## Workflow

1. Verify current branch with `git branch --show-current`.
2. If branch is `main`, stop and ask user to create/switch branches first.
3. Review changes with `git status` and `git diff --staged` / `git diff`.
4. Run preflight checks: `just pre-flight`.
5. Stage everything with `git add -A`.
6. Write a commit message with:
    - Subject line (concise, action-oriented).
    - Body that explains why the change exists and user impact.
7. Commit with a multi-line message (HEREDOC preferred).
8. Push:
    - If no upstream: `git push -u origin HEAD`
    - Else: `git push`

## Commit Message Rules

- Include meaningful why-context in the body.
- Avoid empty or one-line commits when context is needed.
- Keep message factual and user-relevant.

## Safety Rails

- Never push to `main`.
- Never use `--no-verify`.
- Never use force-push in this skill unless user explicitly asks.
- If `just pre-flight` fails, stop and report the failing step and output.
- If commit or push fails, report the exact failure and next step.
