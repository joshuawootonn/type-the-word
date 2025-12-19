# List available commands
default:
    @just --list

# Start the database containers
db-up:
    docker compose --project-directory ./docker up -d

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
    export $(xargs <.env) && drizzle-kit migrate

# Run migrations on test database
migrate-test:
    export $(xargs <.env.test) && drizzle-kit migrate

# Run migrations on test database
migrate-prod:
    export $(xargs <.env.prod) && drizzle-kit migrate

# Generate a new migration from schema changes
generate:
    pnpm exec dotenv drizzle-kit generate

# Start development server
dev:
    kill $(lsof -t -i:1199) || true && orb start && docker compose --project-directory ./docker up -d && export $(xargs < .env) && pnpm dev -p 1199

# Run tests
test:
    export $(xargs <.env.test) && pnpm run test 

# Run tests in watch mode
test-watch:
    export $(xargs <.env.test) && pnpm run test:watch 

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

# Drop the database schema and recreate it (WARNING: deletes all data)
db-reset:
    docker exec -it type_the_word-postgres-1 psql -U postgres -d type-the-word -c "DROP SCHEMA IF EXISTS \"type-the-word\" CASCADE;"
    docker exec -it type_the_word-postgres-1 psql -U postgres -d type-the-word -c "DROP SCHEMA IF EXISTS \"drizzle\" CASCADE;"
    docker exec -it type_the_word-postgres-1 psql -U postgres -d type-the-word -c "CREATE SCHEMA \"type-the-word\";"
    docker exec -it type_the_word-postgres-1 psql -U postgres -d type-the-word -c "CREATE SCHEMA \"drizzle\";"
    pnpm exec dotenv drizzle-kit migrate
    @echo "✅ Database has been reset"
