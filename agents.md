# Database Migration Guidelines

This document outlines best practices for managing database migrations in this project using Drizzle ORM.

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
