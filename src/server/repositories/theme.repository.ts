import * as schema from '~/server/db/schema'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { ValidationError } from '../error-utils'

export const themeRecordSchema = createSelectSchema(schema.theme).merge(
    z.object({
        label: z.string().min(1),
        value: z.string().min(1),
    }),
)

export type ThemeRecord = z.infer<typeof themeRecordSchema>

export const currentThemeRecordSchema = createSelectSchema(
    schema.userTheme,
).merge(z.object({ currentThemeValue: z.string().min(1).nullish() }))

export type CurrentThemeRecord = z.infer<typeof currentThemeRecordSchema>
export type CurrentTheme = {
    userId: string
    value: string
}

const uniqueConstraintErrorSchema = z.object({
    message: z.string(),
    code: z.literal('23505'),
})

export class UniqueConstraintError extends ValidationError {}

export class ThemeRepository {
    db: PostgresJsDatabase<typeof schema>
    constructor(db: PostgresJsDatabase<typeof schema>) {
        this.db = db
    }
    async getCurrentTheme({
        userId,
    }: {
        userId: string
    }): Promise<CurrentThemeRecord | null> {
        const result =
            (await this.db.query.userTheme.findFirst({
                where: eq(schema.userTheme.userId, userId),
            })) ?? null

        return result
    }

    async setCurrentTheme(
        theme: CurrentThemeRecord,
    ): Promise<CurrentThemeRecord | null> {
        const currentTheme = await this.getCurrentTheme({
            userId: theme.userId,
        })

        if (currentTheme == null) {
            return (
                (
                    await this.db
                        .insert(schema.userTheme)
                        .values(theme)
                        .returning()
                ).at(0) ?? null
            )
        }
        return (
            (
                await this.db
                    .update(schema.userTheme)
                    .set({
                        currentThemeValue: theme.currentThemeValue,
                        currentDarkThemeId: theme.currentDarkThemeId,
                        currentLightThemeId: theme.currentLightThemeId,
                    })
                    .where(eq(schema.userTheme.userId, theme.userId))
                    .returning()
            ).at(0) ?? null
        )
    }

    async getMany({
        userId,
    }: {
        userId: string
    }): Promise<ThemeRecord[] | null> {
        const result =
            (await this.db.query.theme.findMany({
                where: eq(schema.theme.userId, userId),
            })) ?? null

        return result
    }

    async createTheme({
        userId,
        label,
        value,
        primaryLightness,
        primaryChroma,
        primaryHue,
        secondaryLightness,
        secondaryChroma,
        secondaryHue,
        successLightness,
        successChroma,
        successHue,
        errorLightness,
        errorChroma,
        errorHue,
    }: Omit<ThemeRecord, 'id'>): Promise<ThemeRecord> {
        return await this.db
            .insert(schema.theme)
            .values({
                userId,
                label,
                value,
                primaryLightness,
                primaryChroma,
                primaryHue,
                secondaryHue,
                secondaryChroma,
                secondaryLightness,
                errorHue,
                errorChroma,
                errorLightness,
                successHue,
                successChroma,
                successLightness,
            })
            .returning()
            .execute()
            .catch(e => {
                const result = uniqueConstraintErrorSchema.safeParse(e)
                if (result.success) {
                    throw new UniqueConstraintError({
                        label: 'Label already used',
                    })
                }
                throw e
            })
            .then(result => result.at(0)!)
    }

    async deleteTheme({ id }: { id: string }) {
        return this.db.delete(schema.theme).where(eq(schema.theme.id, id))
    }
}
