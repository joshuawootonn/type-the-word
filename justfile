# List available commands
default:
    @just --list

# Start the database containers
db-up:
    docker compose --project-directory ./docker up -d

# Stop the database containers
db-down:
    docker compose --project-directory ./docker down

# Run migrations on development database
migrate:
    pnpm exec dotenv drizzle-kit migrate

# Run migrations on test database
migrate-test:
    pnpm exec dotenv --env-file .env.test drizzle-kit migrate

# Generate a new migration from schema changes
generate:
    pnpm exec dotenv drizzle-kit generate

# Start development server
dev:
    kill $(lsof -t -i:1199) || true && orb start && docker compose --project-directory ./docker up -d && pnpm dev -p 1199


# Run tests
test:
    pnpm exec dotenv --env-file .env.test vitest

# Run tests in watch mode
test-watch:
    pnpm exec dotenv --env-file .env.test vitest --watch --reporter=verbose

# Build the project
build:
    pnpm build

# Format code
format:
    pnpm format

# Lint code
lint:
    pnpm lint

# Full setup: start db and run migrations
setup: db-up migrate
    @echo "✅ Database is up and migrations are complete"

