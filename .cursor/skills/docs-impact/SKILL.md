---
name: docs-impact
description: Checks whether current branch changes require documentation updates and auto-suggests concrete doc edits. Use when the user asks for docs impact analysis, documentation follow-ups, or proposed doc updates from code changes.
---

# docs-impact

## Purpose

Identify documentation implications for the current branch and generate high-signal, file-specific doc update suggestions.

## Defaults

- Compare branch work against `main`.
- Prioritize user-facing and contributor-facing docs updates.
- Suggest edits even when no docs files were changed in the branch.
- Keep suggestions concise, actionable, and grounded in changed code.

## Workflow

1. Confirm branch context:
    - `git branch --show-current`
    - If on `main`, stop and ask for a feature branch.
2. Sync base branch refs:
    - `git fetch origin main`
3. Gather change context:
    - `git log --oneline origin/main...HEAD`
    - `git diff --name-status origin/main...HEAD`
    - `git diff --stat origin/main...HEAD`
4. Detect docs impact from changed files and diffs:
    - API/behavior changes -> README, route docs, API docs
    - Env/config/dependency changes -> README, CONTRIBUTING, setup docs
    - Database/schema/migration changes -> migration/docs guidelines
    - UX/flow/text changes -> user-facing pages/changelog/help content
    - New scripts/commands -> contributor docs and runbooks
5. Inspect existing docs edits on the branch:
    - If docs were updated, verify they match code changes.
    - If docs were not updated but impact exists, propose targeted updates.
6. Produce a structured output with:
    - **Impact verdict**: `none`, `low`, `medium`, or `high`
    - **Why**: short rationale tied to changed files
    - **Suggested doc files**: exact paths
    - **Proposed edits**: bullet points or patch-style snippets
    - **Priority order**: what to update first
7. Offer to apply the suggested documentation edits automatically if the user wants.

## Output Template

Use this format:

```md
## Docs Impact Summary
- Verdict: <none|low|medium|high>
- Reason: <1-2 sentences>

## Suggested Documentation Updates
1. `<path/to/doc-file>`
   - Why: <reason tied to code change>
   - Suggested update:
     - <bullet or short patch snippet>

2. `<path/to/doc-file>`
   - Why: <reason>
   - Suggested update:
     - <bullet or short patch snippet>

## Confidence / Gaps
- <any assumptions, unknowns, or follow-up checks>
```

## Safety Rails

- Never invent behavior not present in branch diffs.
- Never reference doc paths that do not exist without explicitly saying they are proposed new files.
- Do not claim docs are up-to-date without checking changed code and existing docs edits.
- Keep recommendations scoped to the branch changes; avoid broad unrelated rewrites.
