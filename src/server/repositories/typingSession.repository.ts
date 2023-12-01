import { PlanetScaleDatabase } from 'drizzle-orm/planetscale-serverless'
import * as schema from '~/server/db/schema'
import { desc, eq, SQL } from 'drizzle-orm'
import { Book, Chapter, typedVerses, typingSessions } from '~/server/db/schema'
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
        typedVerse,
    }: {
        userId: string | SQL
        typedVerse?: {
            book: Book
            chapter: Chapter
            translation: 'esv'
        }
    }): Promise<TypingSession[]> {
        const where = eq(typingSessions.userId, userId)

        return await this.db.query.typingSessions.findMany({
            with: {
                typedVerses: typedVerse
                    ? {
                          where: (typedVerses, { eq }) =>
                              eq(typedVerses.book, typedVerse.book) &&
                              eq(typedVerses.chapter, typedVerse.chapter) &&
                              eq(
                                  typedVerses.translation,
                                  typedVerse.translation,
                              ),
                      }
                    : true,
            },
            where,
            orderBy: [desc(typingSessions.createdAt)],
        })
    }
}
