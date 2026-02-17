# Database Migration Guidelines

This document outlines best practices for managing database migrations in this project using Drizzle ORM.

## Git Hooks

After cloning, run:

```bash
just init
```

This installs the tracked `pre-commit` hook, which runs `just pre-flight`.

## Core Principle

**Always use Drizzle CLI for database migrations. Never modify the database schema directly.**

## Migration Workflow

### 1. Making Schema Changes

1. **Update the schema file**: Edit `src/server/db/schema.ts` with your changes
2. **Generate migration**: Run `just generate` or `pnpm db:generate`
3. **Review the migration**: Check the generated SQL file in `drizzle/` directory
4. **Make migrations idempotent** (if needed): Add `IF NOT EXISTS` to CREATE statements and enum additions
5. **Apply migration**: Run `just migrate` (dev), `just migrate-test` (test), or `just migrate-prod` (production)

### 2. Commands Reference

```bash
# Generate a new migration from schema changes
just generate
# or
pnpm db:generate

# Run migrations on development database
just migrate

# Run migrations on test database
just migrate-test

# Run migrations on production database
just migrate-prod
```

## Making Migrations Idempotent

When modifying migrations for safety across different database states, use these patterns:

```sql
-- For enum values
ALTER TYPE "public"."my_enum" ADD VALUE IF NOT EXISTS 'new_value';

-- For tables
CREATE TABLE IF NOT EXISTS "my_table" (...);

-- For indexes
CREATE INDEX IF NOT EXISTS "my_index" ON "my_table" (...);
```

This allows migrations to run safely on databases that may already have some changes applied.

## What NOT to Do

1. **Don't run SQL directly on the database** - This desynchronizes Drizzle's state
2. **Don't manually create migration files** - Always use `drizzle-kit generate`
3. **Don't edit the `_journal.json` manually** - Drizzle manages this file
4. **Don't skip migrations** - Apply them in order through Drizzle CLI

## If You've Already Modified the Database Directly

If you accidentally modified the database directly (bypassing Drizzle):

1. Run `just generate` to create a migration that captures the changes
2. **Edit the generated SQL to be idempotent** using `IF NOT EXISTS` patterns
3. Run `just migrate` - it will apply safely (skipping existing objects)
4. The migration will now work for other developers and environments

## Migration File Structure

Migrations are stored in the `drizzle/` directory:

- SQL files: `drizzle/XXXX_description.sql` - The actual migration SQL
- Metadata: `drizzle/meta/_journal.json` - Tracks all migrations
- Snapshots: `drizzle/meta/XXXX_snapshot.json` - Schema snapshots for each migration

**Important**: Each migration must have a corresponding snapshot file. Don't create migrations manually without using `drizzle-kit generate`.

## Environment-Specific Notes

- **Development**: Use `just migrate` after generating migrations
- **Test**: Use `just migrate-test` to apply migrations to test database
- **Production**: Use `just migrate-prod` - always review migrations before applying

## Additional Resources

- [Drizzle ORM Migration Docs](https://orm.drizzle.team/docs/migrations)
- [Drizzle Kit CLI Reference](https://orm.drizzle.team/kit-docs/overview)

---

# TypeScript & Code Quality Guidelines

## Core Principles

1. **No Type Casting**: Never use `as any`, `as unknown`, or type assertions to bypass TypeScript errors. If types don't match, fix the underlying issue.

2. **No ESLint Ignores Without Permission**: Never add `// eslint-disable` comments or `@ts-ignore` / `@ts-expect-error` without explicitly asking for permission first.

3. **Type Safety First**: If TypeScript complains, there's usually a good reason. Address the root cause rather than suppressing the error.

4. **Always have return types for functions** - If a function doesn't return a value, it should have a return type of `void`.

## Examples

### ❌ Bad - Type Casting

```typescript
// BAD: Using 'as any' to bypass type checking
translation: data.translation as any,
book: data.book as any,
```

### ✅ Good - Proper Typing

```typescript
// GOOD: Use proper type imports and let TypeScript infer or validate
import { Translation, Book } from '~/server/db/schema'

// Then use the types properly without casting
translation: data.translation, // TypeScript validates this is correct type
book: data.book,
```

### When You Need Help

If you encounter a type error you can't resolve:

1. Show the error to the user
2. Explain what's causing it
3. Ask for guidance on the proper solution

**Never silently cast or ignore - always fix properly or ask for help.**

---

# Next.js Component Architecture Guidelines

## Server vs. Client Components

### File Naming Convention

When creating a page route with a Server Component that renders a Client Component, follow this structure:

```
src/app/some-route/
├── page.tsx          (Server Component - data fetching, auth checks)
├── client-page.tsx   (Client Component - interactive UI)
└── actions.ts        (Client-side fetch functions)
```

**Key Rules:**

1. **`page.tsx`** - Always a Server Component (default)
    - Handles server-side data fetching
    - Performs authentication checks
    - Queries database directly
    - Passes initial data as props to client component

2. **`client-page.tsx`** - The main Client Component for the route
    - Uses `'use client'` directive
    - Handles user interactions (clicks, form submissions, etc.)
    - Manages client-side state
    - Receives initial data from Server Component

3. **`actions.ts`** - Client-side actions
    - Uses `'use client'` directive
    - Contains fetch functions that call API routes
    - Colocated with the page that uses them
    - Uses Zod schemas for response validation

### Example Structure

```typescript
// page.tsx (Server Component)
import { getServerSession } from 'next-auth'
import { ClientPage } from './client-page'

export default async function SomePage() {
    const session = await getServerSession()
    const data = await fetchSomeData(session.user.id)

    return <ClientPage initialData={data} />
}

// client-page.tsx (Client Component)
'use client'

export function ClientPage({ initialData }) {
    const [data, setData] = useState(initialData)
    // ... interactive logic
}

### Benefits of This Pattern

- ✅ Server-side rendering with immediate data
- ✅ Clear separation of server vs. client logic
- ✅ Consistent naming across the codebase
- ✅ Easy to locate client-side logic
- ✅ Better performance (less client-side JavaScript)
```

---

# UI Component & Design System Guidelines

## UI Primitives Location

All reusable UI primitives should be located in `src/components/ui/`. These components provide consistent styling and behavior across the application.

### Available Primitives

- **`<Input />`** - Text/number/date inputs with SVG outline focus state
- **`<Textarea />`** - Multiline text input with SVG outline focus state
- \*\*<Select />`- Radix UI Select with custom styling (also:`SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`)
- **`<Link />`** - Next.js Link with button or text variants
- **`<Meter />`** - Base UI Meter for progress bars
- **`<Loading />`** - Animated loading indicator

## Design System Rules

### 1. No Rounded Corners

**Never use `rounded-sm` classes.** This application uses sharp, rectangular design throughout.

```tsx
// ❌ BAD: Using rounded corners
<div className="rounded-lg border">

// ✅ GOOD: Sharp corners
<div className="border-2 border-primary">
```

### 2. Color Scheme

Use the semantic color utilities that work with the theme system:

- **`text-primary`** - Primary text color (adapts to theme)
- **`bg-primary`** - Primary background color
- **`text-secondary`** - Secondary text color
- **`bg-secondary`** - Secondary background color (main page background)
- **`text-success`** - Success/completion color (green)
- **`text-error`** - Error color (red)
- **`border-primary`** - Primary border color

**Never use:** Hardcoded colors like `text-gray-600`, `bg-white`, `bg-blue-600`, etc.

### 3. Border Styling

Always use `border-2` for consistency:

```tsx
// ✅ Consistent border width
<div className="border-2 border-primary">
```

### 4. Button Styling

Standard button pattern:

```tsx
<button className="svg-outline relative border-2 border-primary bg-secondary px-3 py-1 font-semibold">
    Click Me
</button>
```

**Key classes:**

- `svg-outline relative` - Focus state with dashed border
- `border-2 border-primary` - Standard border
- `bg-secondary` - Background matches page
- `px-3 py-1` - Standard padding
- `font-semibold` - Button text weight

**Disabled state:**

```tsx
<button disabled className="... disabled:cursor-wait">
```

**❌ Don't use:** `disabled:opacity-50` - Buttons should keep their color when disabled, only cursor changes.

### 5. Link Styling

Use the `<Link>` primitive:

```tsx
// Button-style link (default)
<Link href="/somewhere">Action Text</Link>

// Text-style link (breadcrumbs, inline text)
<Link href="/somewhere" variant="text">Dashboard</Link>

// Custom styled link (cards, complex layouts)
<NextLink href="/somewhere" className="block p-4 no-underline">
    // Custom content
</NextLink>
```

### 6. Input Styling

Always use the `<Input>` or `<Textarea>` primitives which include:

- SVG outline focus state
- Consistent border and padding
- Theme-aware colors

```tsx
// ✅ Use primitive
<Input type="text" />
<Textarea rows={3} />

// ❌ Don't use raw inputs
<input className="border-2..." />
```

### 7. Typography with Prose

Most layouts use Tailwind Typography's `prose` class. When working within prose layouts:

```tsx
// Strip unnecessary text utilities - let prose handle it
<h1>Title</h1>  // ✅ No need for text-3xl, font-semibold, etc.

// When you need to break out of prose styles:
<div className="not-prose">
    {/* Custom styling here */}
</div>
```

### 8. Form Layouts

Standard form structure:

```tsx
<form className="not-prose space-y-6">
    <div>
        <label htmlFor="field" className="mb-2 block">
            Field Label
        </label>
        <Input id="field" type="text" required />
    </div>

    {/* Submit buttons - right aligned */}
    <div className="flex justify-end gap-3 border-t-2 border-primary pt-6">
        <button
            type="submit"
            className="svg-outline relative border-2 border-primary bg-secondary px-3 py-1 font-semibold"
        >
            Submit
        </button>
        <Link href="/cancel">Cancel</Link>
    </div>
</form>
```

### 9. Error/Success Messages

```tsx
// Error message
<div className="not-prose flex items-start gap-3 border-2 border-error bg-secondary p-4">
    <svg className="h-5 w-5 shrink-0 text-error" {/* icon */} />
    <div className="text-sm text-error">{error}</div>
</div>

// Success message
<div className="not-prose flex items-start gap-3 border-2 border-success bg-secondary p-4">
    <svg className="h-5 w-5 shrink-0 text-success" {/* icon */} />
    <div className="text-sm text-success">{message}</div>
</div>
```

### 10. SVG Outline Focus States

The application uses a custom dashed-border focus state (`.svg-outline`):

```tsx
// For buttons, links, inputs
<button className="svg-outline relative border-2 border-primary ...">

// Input/Textarea primitives handle this automatically via wrapper:
<div className="group svg-outline relative">
    <div className="svg-outline-override absolute -z-10 hidden group-focus-within:block" />
    <input className="outline-hidden ..." />
</div>
```

### 11. Book Name Formatting

When displaying book names to users:

```tsx
import toProperCase from "~/lib/toProperCase"

// Convert from database format to display format
const displayName = toProperCase(book.split("_").join(" "))
// "1_corinthians" → "1 Corinthians"
// "song_of_solomon" → "Song Of Solomon"
```

### 12. Shared API Schemas

API response schemas should be shared between client and server:

```typescript
// src/app/api/some-route/schemas.ts
export const responseSchema = z.object({
    data: z.string(),
})
export type Response = z.infer<typeof responseSchema>

// Server uses it:
const response: Response = { data: "value" }
return NextResponse.json(response)

// Client validates it:
const data = await response.json()
const validated = responseSchema.parse(data)
```

**Benefits:**

- Type safety on both ends
- Runtime validation catches API contract violations
- Single source of truth for API contracts
