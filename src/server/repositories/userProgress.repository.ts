import { and, eq, sql } from "drizzle-orm"
import { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import { getBibleMetadata, BookMetadata } from "~/server/bibleMetadata"
import * as schema from "~/server/db/schema"

// Use Drizzle's inferred types to avoid casting
export type BookProgressRow = typeof schema.userBookProgress.$inferSelect
export type ChapterProgressRow = typeof schema.userChapterProgress.$inferSelect

// Combined type for the overview
export type UserProgressData = {
    books: BookProgressRow[]
    chapters: ChapterProgressRow[]
}

export class UserProgressRepository {
    db: PostgresJsDatabase<typeof schema>
    constructor(db: PostgresJsDatabase<typeof schema>) {
        this.db = db
    }

    /**
     * Get all progress for a user (books and chapters) filtered by translation
     */
    async getByUserId(
        userId: string,
        translation: schema.Translation,
    ): Promise<UserProgressData> {
        const [books, chapters] = await Promise.all([
            this.db.query.userBookProgress.findMany({
                where: and(
                    eq(schema.userBookProgress.userId, userId),
                    eq(schema.userBookProgress.translation, translation),
                ),
            }),
            this.db.query.userChapterProgress.findMany({
                where: and(
                    eq(schema.userChapterProgress.userId, userId),
                    eq(schema.userChapterProgress.translation, translation),
                ),
            }),
        ])

        return { books, chapters }
    }

    /**
     * Get chapter progress for a specific book and translation
     */
    async getChaptersByUserIdAndBook(
        userId: string,
        book: schema.Book,
        translation: schema.Translation,
    ): Promise<ChapterProgressRow[]> {
        return this.db.query.userChapterProgress.findMany({
            where: and(
                eq(schema.userChapterProgress.userId, userId),
                eq(schema.userChapterProgress.book, book),
                eq(schema.userChapterProgress.translation, translation),
            ),
        })
    }

    /**
     * Get book progress for a specific book and translation
     */
    async getBookProgress(
        userId: string,
        book: schema.Book,
        translation: schema.Translation,
    ): Promise<BookProgressRow | undefined> {
        return this.db.query.userBookProgress.findFirst({
            where: and(
                eq(schema.userBookProgress.userId, userId),
                eq(schema.userBookProgress.book, book),
                eq(schema.userBookProgress.translation, translation),
            ),
        })
    }

    /**
     * Record a typed verse and handle prestige logic
     * Returns true if the book was prestiged
     */
    async recordTypedVerse(
        userId: string,
        book: schema.Book,
        chapter: number,
        verse: number,
        translation: schema.Translation,
    ): Promise<{ prestiged: boolean }> {
        const bibleMetadata = getBibleMetadata()
        const bookMetadata = bibleMetadata[book]

        if (!bookMetadata) {
            throw new Error(`Unknown book: ${book}`)
        }

        const chapterMetadata = bookMetadata.chapters[chapter - 1]
        if (!chapterMetadata) {
            throw new Error(`Unknown chapter ${chapter} in ${book}`)
        }

        const totalVersesInChapter = chapterMetadata.length
        const totalVersesInBook = bookMetadata.chapters.reduce(
            (sum, ch) => sum + ch.length,
            0,
        )

        // Upsert the chapter progress row
        await this.db
            .insert(schema.userChapterProgress)
            .values({
                userId,
                book,
                chapter,
                translation,
                typedVerses: { [verse]: true },
                typedVerseCount: 1,
                totalVerses: totalVersesInChapter,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: [
                    schema.userChapterProgress.userId,
                    schema.userChapterProgress.book,
                    schema.userChapterProgress.chapter,
                    schema.userChapterProgress.translation,
                ],
                set: {
                    typedVerses: sql`
                        ${schema.userChapterProgress.typedVerses} || jsonb_build_object(${verse}::text, true)
                    `,
                    typedVerseCount: sql`
                        (SELECT COUNT(*) FROM jsonb_object_keys(
                            ${schema.userChapterProgress.typedVerses} || jsonb_build_object(${verse}::text, true)
                        ))::int
                    `,
                    updatedAt: new Date(),
                },
            })

        // Calculate the new book-level typed verse count
        const chapterProgress = await this.getChaptersByUserIdAndBook(
            userId,
            book,
            translation,
        )
        const bookTypedVerseCount = chapterProgress.reduce(
            (sum, ch) => sum + ch.typedVerseCount,
            0,
        )

        // Upsert book progress row with updated totals
        await this.db
            .insert(schema.userBookProgress)
            .values({
                userId,
                book,
                translation,
                prestige: 0,
                typedVerseCount: bookTypedVerseCount,
                totalVerses: totalVersesInBook,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: [
                    schema.userBookProgress.userId,
                    schema.userBookProgress.book,
                    schema.userBookProgress.translation,
                ],
                set: {
                    typedVerseCount: bookTypedVerseCount,
                    updatedAt: new Date(),
                },
            })

        // Check if the book is now complete (all chapters at 100%)
        const isBookComplete = this.isBookComplete(
            chapterProgress,
            bookMetadata,
        )

        if (isBookComplete) {
            await this.prestigeBook(userId, book, translation)
            return { prestiged: true }
        }

        return { prestiged: false }
    }

    /**
     * Check if all chapters in a book are complete
     */
    private isBookComplete(
        chapterProgress: ChapterProgressRow[],
        bookMetadata: BookMetadata,
    ): boolean {
        // Need a row for every chapter in the book
        if (chapterProgress.length !== bookMetadata.chapters.length) {
            return false
        }

        // Every chapter must have all verses typed
        return chapterProgress.every(
            chapter => chapter.typedVerseCount >= chapter.totalVerses,
        )
    }

    /**
     * Increment prestige for a book and reset all chapter progress
     */
    private async prestigeBook(
        userId: string,
        book: schema.Book,
        translation: schema.Translation,
    ): Promise<void> {
        // Increment prestige and reset typed count on the book table
        await this.db
            .update(schema.userBookProgress)
            .set({
                prestige: sql`${schema.userBookProgress.prestige} + 1`,
                typedVerseCount: 0,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(schema.userBookProgress.userId, userId),
                    eq(schema.userBookProgress.book, book),
                    eq(schema.userBookProgress.translation, translation),
                ),
            )

        // Reset chapter progress
        await this.db
            .update(schema.userChapterProgress)
            .set({
                typedVerses: {},
                typedVerseCount: 0,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(schema.userChapterProgress.userId, userId),
                    eq(schema.userChapterProgress.book, book),
                    eq(schema.userChapterProgress.translation, translation),
                ),
            )
    }

    /**
     * Batch upsert for backfill - sets exact values
     */
    async batchUpsert(data: {
        books: Array<{
            userId: string
            book: schema.Book
            translation: schema.Translation
            prestige: number
            typedVerseCount: number
            totalVerses: number
        }>
        chapters: Array<{
            userId: string
            book: schema.Book
            chapter: number
            translation: schema.Translation
            typedVerses: Record<number, boolean>
            totalVerses: number
        }>
    }): Promise<void> {
        // Upsert book progress rows
        for (const bookRow of data.books) {
            await this.db
                .insert(schema.userBookProgress)
                .values({
                    userId: bookRow.userId,
                    book: bookRow.book,
                    translation: bookRow.translation,
                    prestige: bookRow.prestige,
                    typedVerseCount: bookRow.typedVerseCount,
                    totalVerses: bookRow.totalVerses,
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: [
                        schema.userBookProgress.userId,
                        schema.userBookProgress.book,
                        schema.userBookProgress.translation,
                    ],
                    set: {
                        prestige: bookRow.prestige,
                        typedVerseCount: bookRow.typedVerseCount,
                        totalVerses: bookRow.totalVerses,
                        updatedAt: new Date(),
                    },
                })
        }

        // Upsert chapter progress rows
        for (const chapterRow of data.chapters) {
            await this.db
                .insert(schema.userChapterProgress)
                .values({
                    userId: chapterRow.userId,
                    book: chapterRow.book,
                    chapter: chapterRow.chapter,
                    translation: chapterRow.translation,
                    typedVerses: chapterRow.typedVerses,
                    typedVerseCount: Object.keys(chapterRow.typedVerses).length,
                    totalVerses: chapterRow.totalVerses,
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: [
                        schema.userChapterProgress.userId,
                        schema.userChapterProgress.book,
                        schema.userChapterProgress.chapter,
                        schema.userChapterProgress.translation,
                    ],
                    set: {
                        typedVerses: chapterRow.typedVerses,
                        typedVerseCount: Object.keys(chapterRow.typedVerses)
                            .length,
                        updatedAt: new Date(),
                    },
                })
        }
    }
}
