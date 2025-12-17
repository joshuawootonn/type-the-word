import { eq } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

import * as schema from '~/server/db/schema'

import { ThemeRecord, themeRecordSchema } from './builtinTheme.repository'

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

    async createTheme({
        userId,
        theme,
    }: {
        userId: string
        theme: Omit<ThemeRecord, 'id'>
    }): Promise<UserThemeRecord> {
        return await this.db.transaction(async tx => {
            const insertedRecords = await tx
                .insert(schema.theme)
                .values(theme)
                .returning()
                .execute()

            const themeRecord = insertedRecords.at(0)!
            await tx
                .insert(schema.userTheme)
                .values({ userId, themeId: themeRecord.id })
                .returning()
                .execute()

            const result = await tx.query.userTheme.findFirst({
                with: {
                    theme: true,
                },
                where: eq(schema.userTheme.themeId, themeRecord.id),
            })

            if (result == null) {
                throw new Error(
                    'Failed to create theme. Fetching theme after creation returned null.',
                )
            }

            return result
        })
    }

    async deleteTheme({ id }: { id: string }) {
        return this.db.delete(schema.theme).where(eq(schema.theme.id, id))
    }
}
