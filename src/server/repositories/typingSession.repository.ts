import { PlanetScaleDatabase } from 'drizzle-orm/planetscale-serverless'
import * as schema from '~/server/db/schema'
import { and, desc, eq, SQL } from 'drizzle-orm'
import {
    Book,
    Chapter,
    typedVerses,
    typingSessions,
    users,
} from '~/server/db/schema'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const typingSessionSchema = createSelectSchema(typingSessions).and(
    z.object({ typedVerses: z.array(createSelectSchema(typedVerses)) }),
)

export type TypingSession = z.infer<typeof typingSessionSchema>
export type TypedVerse = TypingSession['typedVerses'][number]

export class TypingSessionRepository {
    db: PlanetScaleDatabase<typeof schema>
    constructor(db: PlanetScaleDatabase<typeof schema>) {
        this.db = db
    }

    async getOneOrNull({
        userId,
        id,
    }: {
        userId?: string | SQL
        id?: string | SQL
    }): Promise<TypingSession | null> {
        const where = userId
            ? eq(typingSessions.userId, userId)
            : id
            ? eq(typingSessions.id, id)
            : null
        if (where == null) {
            throw new Error('Must provide either userId or id')
        }
        return (
            (await this.db.query.typingSessions.findFirst({
                with: {
                    typedVerses: true,
                },
                where,
                orderBy: [desc(typingSessions.createdAt)],
            })) ?? null
        )
    }

    async getOne({
        userId,
        id,
    }: {
        userId?: string | SQL
        id?: string | SQL
    }): Promise<TypingSession> {
        const session = await this.getOneOrNull({ userId, id })
        if (session == null) {
            throw new Error('Typing session not found')
        }
        return session
    }

    async getMany({
        userId,
    }: {
        userId: string | SQL
    }): Promise<TypingSession[]> {
        const where = eq(typingSessions.userId, userId)

        const builder = this.db.query.typingSessions.findMany({
            with: {
                typedVerses: {
                    // This nested query automatically filters by typing session so I don't have to add it.
                    // I would just add it to be explicit I don't think there is a simple way of doing so.
                    where: (typedVerse, { eq, and }) =>
                        and(eq(typedVerse.userId, userId)),
                },
            },
            where,
            orderBy: [desc(typingSessions.createdAt)],
        })
        console.log(builder.toSQL())
        return await builder
    }
}
