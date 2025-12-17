import { eq, count as sqlCount } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

import * as schema from '~/server/db/schema'

export const userSchema = createSelectSchema(schema.users)

export type User = z.infer<typeof userSchema>

export class UserRepository {
    db: PostgresJsDatabase<typeof schema>
    constructor(db: PostgresJsDatabase<typeof schema>) {
        this.db = db
    }

    async count(): Promise<number> {
        const result = await this.db
            .select({ count: sqlCount() })
            .from(schema.users)

        return result.at(0)?.count ?? 0
    }

    async getOne({ id }: { id: string }): Promise<User> {
        const user = await this.db.query.users.findFirst({
            where: eq(schema.typedVerses.id, id),
        })

        if (user == null) throw new Error(`Attempted to getOne user with ${id}`)

        return user ?? null
    }
}
