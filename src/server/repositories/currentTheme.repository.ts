import * as schema from '~/server/db/schema'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { createSelectSchema } from 'drizzle-zod'

export const currentThemeRecordSchema = createSelectSchema(
    schema.userCurrentTheme,
)

export const currentThemeSchema = z.union([
    z.object({
        colorScheme: z.literal('system'),
        lightThemeId: z.string(),
        darkThemeId: z.string(),
        userId: z.string(),
    }),
    z.object({
        colorScheme: z.literal('light'),
        lightThemeId: z.string(),
        darkThemeId: z.null(),
        userId: z.string(),
    }),
    z.object({
        colorScheme: z.literal('dark'),
        lightThemeId: z.null(),
        darkThemeId: z.string(),
        userId: z.string(),
    }),
])

export type CurrentThemeRecord = z.infer<typeof currentThemeRecordSchema>
export type CurrentTheme = z.infer<typeof currentThemeSchema>

const recordSchema = currentThemeRecordSchema
    .nullable()
    .pipe(currentThemeSchema.nullable())

export class CurrentThemeRepository {
    db: PostgresJsDatabase<typeof schema>
    constructor(db: PostgresJsDatabase<typeof schema>) {
        this.db = db
    }
    async getCurrentTheme({
        userId,
    }: {
        userId: string
    }): Promise<CurrentTheme | null> {
        const result =
            (await this.db.query.userCurrentTheme.findFirst({
                where: eq(schema.userTheme.userId, userId),
            })) ?? null

        return currentThemeRecordSchema
            .nullable()
            .pipe(currentThemeSchema.nullable())
            .parse(result)
    }

    async setCurrentTheme({
        userId,
        lightThemeId,
        darkThemeId,
        colorScheme,
    }: CurrentTheme): Promise<CurrentTheme | null> {
        const currentTheme = await this.getCurrentTheme({
            userId,
        })

        if (currentTheme == null) {
            return recordSchema.parse(
                (
                    await this.db
                        .insert(schema.userCurrentTheme)
                        .values({
                            userId,
                            lightThemeId,
                            darkThemeId,
                            colorScheme,
                        })
                        .returning()
                ).at(0) ?? null,
            )
        }
        return recordSchema.parse(
            (
                await this.db
                    .update(schema.userCurrentTheme)
                    .set({
                        lightThemeId: lightThemeId,
                        darkThemeId: darkThemeId,
                        colorScheme,
                    })
                    .where(eq(schema.userCurrentTheme.userId, userId))
                    .returning()
            ).at(0) ?? null,
        )
    }
}
