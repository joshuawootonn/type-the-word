import * as schema from '~/server/db/schema'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { themeRecordSchema } from './builtinTheme.repository'

export const userThemeRecordSchema = createSelectSchema(schema.userTheme).merge(
    z.object({
        theme: themeRecordSchema,
    }),
)

export type UserThemeRecord = z.infer<typeof userThemeRecordSchema>

export class UserThemeRepository {
    db: PostgresJsDatabase<typeof schema>
    constructor(db: PostgresJsDatabase<typeof schema>) {
        this.db = db
    }

    async getMany({ userId }: { userId: string }): Promise<UserThemeRecord[]> {
        const result = await this.db.query.userTheme.findMany({
            with: {
                theme: true,
            },
            where: eq(schema.userTheme.userId, userId),
        })

        return result.filter((t): t is UserThemeRecord => t.theme !== null)
    }
}
