import * as schema from '~/server/db/schema'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { and, desc, eq, count as sqlCount } from 'drizzle-orm'
import { TypedVerse } from './typingSession.repository'

export class TypedVerseRepository {
    db: PostgresJsDatabase<typeof schema>
    constructor(db: PostgresJsDatabase<typeof schema>) {
        this.db = db
    }

    async count(): Promise<number> {
        const result = await this.db
            .select({ count: sqlCount() })
            .from(schema.typedVerses)

        return result.at(0)?.count ?? 0
    }

    async getOneOrNull({
        userId,
    }: {
        userId: string
    }): Promise<TypedVerse | null> {
        const typedVerse = await this.db.query.typedVerses.findFirst({
            where: eq(schema.typedVerses.userId, userId),
            orderBy: [desc(schema.typedVerses.createdAt)],
        })

        return typedVerse ?? null
    }

    async getMany({
        userId,
        book,
        chapter,
    }: {
        userId: string
        book?: schema.Book
        chapter?: number
    }): Promise<TypedVerse[]> {
        const builder = this.db.query.typedVerses.findMany({
            where: and(
                ...[
                    eq(schema.typedVerses.userId, userId),
                    book ? eq(schema.typedVerses.book, book) : null,
                    chapter ? eq(schema.typedVerses.chapter, chapter) : null,
                ].flatMap(val => (val ? [val] : [])),
            ),
            orderBy: [desc(schema.typedVerses.createdAt)],
        })

        return await builder
    }
}
