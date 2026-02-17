# List available commands
default:
    @just --list

# Initialize local git hooks and developer setup helpers
init:
    bash ./scripts/init.sh

# Start the database containers
db-up:
    export $(xargs < .env) && docker compose --project-directory ./docker up -d

# Stop the database containers
db-down:
    docker compose --project-directory ./docker down

db-local-logs:
    docker compose --project-directory ./docker logs -f postgres

# Stop containers and delete volumes (WARNING: deletes all data)
db-nuke:
    docker compose --project-directory ./docker down -v
    @echo "✅ Database containers stopped and volumes deleted"

db-local-delete:
    docker volume rm type_the_word_pgdata type_the_word_pgdata_test

# Run migrations on development database
migrate:
    export $(xargs <.env) && pnpm db:migrate

# Run migrations on test database
migrate-test:
    export $(xargs <.env.test) && pnpm db:migrate

# Run migrations on test database
migrate-prod:
    export $(xargs <.env.prod) && pnpm db:migrate

# Generate a new migration from schema changes
generate:
    pnpm db:generate

# Check which migrations have been applied to a database
check-migrations-dev:
    export $(xargs <.env) && pnpm dlx tsx scripts/list-migrations.ts

check-migrations-prod:
    export $(xargs <.env.prod) && pnpm dlx tsx scripts/list-migrations.ts

# Start development server
dev:
    export $(xargs < .env) && (kill $(lsof -t -i:${APP_PORT:-1199}) || true) && orb start && docker compose --project-directory ./docker up -d && pnpm dev

# Run tests
test:
    export $(xargs <.env.test) && pnpm run test 

# Run tests in watch mode
test-watch:
    export $(xargs <.env.test) && pnpm test-watch 

# Run end-to-end tests
test-e2e:
    export $(xargs <.env.test) && E2E_PORT=${E2E_APP_PORT:-$(( ${APP_PORT:-1199} + 9 ))} && LOCK_PIDS=$(lsof -t .next/dev/lock 2>/dev/null || true) && ([ -z "$LOCK_PIDS" ] || kill $LOCK_PIDS) && E2E_PIDS=$(lsof -t -i:${E2E_PORT} 2>/dev/null || true) && ([ -z "$E2E_PIDS" ] || kill $E2E_PIDS) && pnpm run test:e2e

# Run end-to-end tests with Playwright UI
test-e2e-ui:
    export $(xargs <.env.test) && pnpm run test:e2e:ui

# Build the project
build:
    pnpm build

# Format code
format:
    pnpm format

# Format code check
format-check:
    pnpm format-check

# Type check code
type-check:
    pnpm type-check
# Lint and auto-fix issues
lint:
    pnpm lint


# Lint code
lint-check:
    pnpm lint-check

# Run all pre-flight checks (including e2e)
pre-flight:
    just lint-check
    just type-check
    just format-check
    just test
    just test-e2e

# Full setup: start db and run migrations
setup: db-up migrate
    @echo "✅ Database is up and migrations are complete"

# Drop the database schema and recreate it (WARNING: deletes all data)
db-reset:
    docker exec -it type_the_word-postgres-1 psql -U postgres -d type-the-word -c "DROP SCHEMA IF EXISTS \"type-the-word\" CASCADE;"
    docker exec -it type_the_word-postgres-1 psql -U postgres -d type-the-word -c "DROP SCHEMA IF EXISTS \"drizzle\" CASCADE;"
    docker exec -it type_the_word-postgres-1 psql -U postgres -d type-the-word -c "CREATE SCHEMA \"type-the-word\";"
    docker exec -it type_the_word-postgres-1 psql -U postgres -d type-the-word -c "CREATE SCHEMA \"drizzle\";"
    pnpm exec dotenv drizzle-kit migrate
    @echo "✅ Database has been reset"
