import * as schema from '~/server/db/schema'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const themeRecordSchema = createSelectSchema(schema.theme)

export type ThemeRecord = z.infer<typeof themeRecordSchema>

export const builtinThemeRecordSchema = createSelectSchema(
    schema.builtinTheme,
).merge(
    z.object({
        theme: themeRecordSchema,
    }),
)

export type BuiltinThemeRecord = z.infer<typeof builtinThemeRecordSchema>

export class BuiltinThemeRepository {
    db: PostgresJsDatabase<typeof schema>
    constructor(db: PostgresJsDatabase<typeof schema>) {
        this.db = db
    }

    async getMany(): Promise<BuiltinThemeRecord[]> {
        const result = await this.db.query.builtinTheme.findMany({
            with: {
                theme: true,
            },
        })

        return result.filter((t): t is BuiltinThemeRecord => t.theme !== null)
    }
}
