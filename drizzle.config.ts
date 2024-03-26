import { type Config } from 'drizzle-kit'

import { env } from '~/env.mjs'

export default {
    schema: './src/server/db/schema.ts',
    driver: 'pg',
    dbCredentials: {
        connectionString: env.POSTGRES_DATABASE_URL,
    },
} satisfies Config
