import { and, desc, eq, gte, lte, SQL } from 'drizzle-orm'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

import * as schema from '~/server/db/schema'
import { typedVerses, typingSessions } from '~/server/db/schema'

export const typingSessionSchema = createSelectSchema(typingSessions).and(
    z.object({
        typedVerses: z.array(createSelectSchema(typedVerses)),
    }),
)

export type TypingSession = z.infer<typeof typingSessionSchema>
export type TypedVerse = TypingSession['typedVerses'][number]

export class TypingSessionRepository {
    db: PostgresJsDatabase<typeof schema>
    constructor(db: PostgresJsDatabase<typeof schema>) {
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
        book,
        chapter,
        startDate,
        endDate,
    }: {
        userId: string | SQL
        book?: schema.Book
        chapter?: number
        startDate?: Date
        endDate?: Date
    }): Promise<TypingSession[]> {
        // Build where conditions
        const conditions = [eq(typingSessions.userId, userId)]

        if (startDate) {
            conditions.push(gte(typingSessions.createdAt, startDate))
        }
        if (endDate) {
            conditions.push(lte(typingSessions.createdAt, endDate))
        }

        const where =
            conditions.length === 1 ? conditions.at(0) : and(...conditions)

        const builder = this.db.query.typingSessions.findMany({
            with: {
                typedVerses: true,
            },
            where,
            orderBy: [desc(typingSessions.createdAt)],
        })
        const result = await builder

        // https://github.com/drizzle-team/drizzle-orm/discussions/2316
        // Once this is resolved I will be able to do this at the db level
        if (book == null && chapter == null) {
            return result
        }

        return result.filter(session =>
            session.typedVerses.some(
                typedVerse =>
                    (chapter ? typedVerse.chapter === chapter : true) &&
                    (book ? typedVerse.book === book : true),
            ),
        )
    }
}
