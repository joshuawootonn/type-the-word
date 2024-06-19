import { defineConfig } from 'drizzle-kit'

import { env } from '~/env.mjs'

export default defineConfig({
    schema: './src/server/db/schema.ts',
    dialect: 'postgresql',
    out: './drizzle',
    dbCredentials: {
        url: env.POSTGRES_DATABASE_URL,
    },
})
