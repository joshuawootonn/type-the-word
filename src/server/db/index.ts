import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { env } from "~/env.mjs"

import * as schema from "./schema"

console.log("env.POSTGRES_DATABASE_URL", env.POSTGRES_DATABASE_URL)

const client = postgres(env.POSTGRES_DATABASE_URL, { idle_timeout: 1 })

export const db = drizzle(client, { schema })
