import { eq, count as sqlCount } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

import * as schema from '~/server/db/schema'

export const userChangelogRecordSchema = createSelectSchema(
    schema.userChangelog,
)

export type UserChangelogRecord = z.infer<typeof userChangelogRecordSchema>

export class UserChangelogRepository {
    db: PostgresJsDatabase<typeof schema>
    constructor(db: PostgresJsDatabase<typeof schema>) {
        this.db = db
    }

    async getOneOrNull({
        userId,
    }: {
        userId: string
    }): Promise<UserChangelogRecord | null> {
        const result =
            (await this.db.query.userChangelog.findFirst({
                where: eq(schema.userChangelog.userId, userId),
            })) ?? null

        return result
    }

    async updateLastVisitedChangelog({
        userId,
        lastVisitedAt,
    }: {
        userId: string
        lastVisitedAt: Date
    }): Promise<UserChangelogRecord> {
        const record = await this.db
            .insert(schema.userChangelog)
            .values({ userId, lastVisitedAt })
            .onConflictDoUpdate({
                target: schema.userChangelog.userId,
                set: { lastVisitedAt },
            })
            .returning()
            .execute()

        return record.at(0)!
    }
}
