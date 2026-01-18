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
