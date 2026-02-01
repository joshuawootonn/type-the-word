import { and, desc, eq, count as sqlCount } from "drizzle-orm"
import { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import * as schema from "~/server/db/schema"

import { TypedVerse } from "./typingSession.repository"

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
        translation,
        omitTypingData = false,
    }: {
        userId: string
        book?: schema.Book
        chapter?: number
        translation?: schema.Translation
        omitTypingData?: boolean
    }): Promise<TypedVerse[]> {
        const builder = this.db.query.typedVerses.findMany({
            where: and(
                ...[
                    eq(schema.typedVerses.userId, userId),
                    book ? eq(schema.typedVerses.book, book) : null,
                    chapter ? eq(schema.typedVerses.chapter, chapter) : null,
                    translation
                        ? eq(schema.typedVerses.translation, translation)
                        : null,
                ].flatMap(val => (val ? [val] : [])),
            ),
            orderBy: [desc(schema.typedVerses.createdAt)],
            columns: omitTypingData
                ? {
                      id: true,
                      userId: true,
                      typingSessionId: true,
                      translation: true,
                      book: true,
                      chapter: true,
                      verse: true,
                      createdAt: true,
                      classroomAssignmentId: true,
                      typingData: false,
                  }
                : undefined,
        })

        const result = await builder

        if (omitTypingData) {
            return result.map((v: TypedVerse) => ({ ...v, typingData: null }))
        }

        return result
    }

    async getManyByAssignment({
        userId,
        assignmentId,
    }: {
        userId: string
        assignmentId: string
    }): Promise<TypedVerse[]> {
        return await this.db.query.typedVerses.findMany({
            where: and(
                eq(schema.typedVerses.userId, userId),
                eq(schema.typedVerses.classroomAssignmentId, assignmentId),
            ),
            orderBy: [desc(schema.typedVerses.createdAt)],
        })
    }
}
