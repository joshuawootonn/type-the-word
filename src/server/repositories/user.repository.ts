import * as schema from '~/server/db/schema'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { count as sqlCount } from 'drizzle-orm'

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
}
