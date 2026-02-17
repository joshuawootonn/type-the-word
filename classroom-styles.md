# classroom-styles.md

Agent-facing style context for `src/app/(classroom)/**`.

## Scope

- Applies to classroom routes/components only.
- Prefer local consistency with existing classroom UIs over global app defaults.

## Layout

- Classroom uses route group: `src/app/(classroom)`.
- Width is controlled by `--classroom-content-max-width` from root layout logic.
- Teacher layout target: wider content (around 1000px behavior).
- Keep nav, main, footer visually aligned inside same width container.

## Typography + Density

- Table text: `text-sm` by default.
- Table headers: regular weight (`font-normal`), not semibold.
- Dense controls near tables should use compact sizing.
- Prefer explicit labels for filters/search; do not rely on placeholder-only UX.

## Input + Label primitives

- Use `Label` primitive (`src/components/ui/label.tsx`) for field labels.
- Use `Input` with `inputSize="compact"` for table filters.
- For filter fields, label copy should be terse (`Filter`, etc.).

## Table conventions (teacher views)

- Use shared table primitive from `src/components/ui/table.tsx`.
- Use TanStack Table for sorting/filtering.
- Keep column content single-line where possible:
    - `whitespace-nowrap`
    - `overflow-hidden`
    - `truncate` / `text-ellipsis`
- Prefer stable column widths (`table-fixed` + explicit width classes when needed).
- Avoid controls that resize cell width on loading/state changes.

## Sorting + filtering

- Teacher assignment list default ordering: newest created assignments first.
- Keep "Load More" behavior intact when present.
- Search/filter should include the fields users expect (e.g. translation where relevant).

## Status presentation

- Do not show raw uppercase enum values to users.
- Convert enum-like values to title case labels.
- Prefer icon + label for status where practical.
- Avoid bordered badge chips unless explicitly requested.

## Meter usage

- Prefer shared `Meter` primitive.
- For dense table rows, prefer:
    - `type="fractional"`
    - `variant="inline"`
- Inline meter should expose detailed values via tooltip.

## Tooltips

- Use shared tooltip primitive from `src/components/ui/tooltip.tsx`.
- For truncated text in tables, show tooltip only when text is actually truncated.

## Assignment detail page conventions (teacher)

- Section heading: `Progress` (not `Student Progress`).
- Search label in student table area: `Filter`.
- Assignment metadata should use compact stat-style layout:
    - label above value
    - no colon formatting
    - avoid heavy framing unless requested

## Guardrails

- Do not reintroduce narrow prose-like layout to classroom pages.
- Do not mix unrelated style refactors with behavior changes in one commit unless tightly coupled.
- Preserve existing accessibility semantics (labels, focus behavior, button states).
