---
name: changelog
description: Writes user-facing changelog entries for Type the Word and updates changelog metadata. Use when the user asks to add changelog notes, release notes, or product updates, especially for src/app/(marketing)/changelog/page.tsx and src/app/(marketing)/changelog/updated-at.ts.
---

# Changelog

## Target Files

- `src/app/(marketing)/changelog/page.tsx`
- `src/app/(marketing)/changelog/updated-at.ts`

## Rules

- Include only user-facing changes.
- Keep entries terse and past tense.
- Do not include implementation details.
- Include an image when it helps communicate what changed.

## Workflow

1. Add a new top entry to `page.tsx`.
2. Follow existing JSX/changelog style.
3. Update `changelogUpdatedAt` in `updated-at.ts` to the newest date.
