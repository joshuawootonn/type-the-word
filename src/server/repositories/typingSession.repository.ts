import { and, desc, eq, gte, lte, sql, SQL } from 'drizzle-orm'
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
        translation,
        startDate,
        endDate,
    }: {
        userId: string | SQL
        book?: schema.Book
        chapter?: number
        translation?: schema.Translation
        startDate?: Date
        endDate?: Date
    }): Promise<TypingSession[]> {
        // Build where conditions
        const conditions: SQL[] = [eq(typingSessions.userId, userId)]

        if (startDate) {
            conditions.push(gte(typingSessions.createdAt, startDate))
        }
        if (endDate) {
            conditions.push(lte(typingSessions.createdAt, endDate))
        }

        // Filter by book/chapter/translation using an EXISTS subquery
        // Note: We use raw SQL because Drizzle's relational query API aliases the
        // main table as "typingSessions" and we need to correlate the subquery
        if (book != null || chapter != null || translation != null) {
            const subqueryConditions: SQL[] = [
                // Reference the alias used by the relational query builder
                sql`"typedVerse"."typingSessionId" = "typingSessions"."id"`,
            ]
            if (book != null) {
                subqueryConditions.push(sql`"typedVerse"."book" = ${book}`)
            }
            if (chapter != null) {
                subqueryConditions.push(
                    sql`"typedVerse"."chapter" = ${chapter}`,
                )
            }
            if (translation != null) {
                subqueryConditions.push(
                    sql`"typedVerse"."translation" = ${translation}`,
                )
            }
            const subqueryWhere = sql.join(subqueryConditions, sql` AND `)
            conditions.push(
                sql`EXISTS (SELECT 1 FROM "typedVerse" WHERE ${subqueryWhere})`,
            )
        }

        const where = and(...conditions)

        return this.db.query.typingSessions.findMany({
            with: {
                typedVerses: true,
            },
            where,
            orderBy: [desc(typingSessions.createdAt)],
        })
    }
}
