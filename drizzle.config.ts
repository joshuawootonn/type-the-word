import { defineConfig } from "drizzle-kit"

import { env } from "~/env.mjs"

console.log(
    "\ndrizzle.config.ts env.POSTGRES_DATABASE_URL",
    env.POSTGRES_DATABASE_URL,
    "\n",
)

export default defineConfig({
    schema: "./src/server/db/schema.ts",
    dialect: "postgresql",
    out: "./drizzle",
    dbCredentials: {
        url: env.POSTGRES_DATABASE_URL,
    },
})
