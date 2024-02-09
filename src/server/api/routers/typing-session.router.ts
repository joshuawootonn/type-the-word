import { createTRPCRouter, protectedProcedure } from '../trpc'
import { Book, typedVerses, typingSessions } from '~/server/db/schema'
import { eq, sql } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import { differenceInMinutes, subMinutes } from 'date-fns'
import {
    TypedVerse,
    TypingSession,
    typingSessionSchema,
} from '~/server/repositories/typingSession.repository'
import { z } from 'zod'
import { getBibleMetadata } from '~/server/bibleMetadata'
import toProperCase from '~/lib/toProperCase'
import { passageReferenceSchema } from '~/lib/passageReference'
import { bookSchema } from '~/lib/types/book'

const addTypedVerseInputSchema = createInsertSchema(typedVerses).omit({
    userId: true,
    id: true,
})

function toPluralBookForm(book: Book) {
    if (book === 'psalm') {
        return 'psalms'
    }

    return book
}

function typingSessionToString(typingSession: TypingSession) {
    const bibleMetadata = getBibleMetadata()

    const books = Array.from(
        new Set(typingSession.typedVerses.map(verse => verse.book)),
    )
        .sort(function (a, b) {
            const biblicalOrder = Object.keys(bibleMetadata)

            const aIndex = biblicalOrder.findIndex(book => book === a)
            const bIndex = biblicalOrder.findIndex(book => book === b)

            if (aIndex === -1 || bIndex === -1) {
                throw new Error('Book not found in typing session to string')
            }

            return aIndex - bIndex
        })
        .map(book => {
            const typedVersesInThisBook = typingSession.typedVerses.filter(
                verse => verse.book === book,
            )

            const chapters: Record<number, number[]> = {}

            typedVersesInThisBook.forEach(verse => {
                chapters[verse.chapter] = [
                    ...(chapters[verse.chapter] ?? []),
                    verse.verse,
                ]
            })

            const chaptersString = Object.entries(chapters)

                .map(([chapter, verses]) => {
                    const uniqueVerses = Array.from(new Set(verses)).sort(
                        function (a, b) {
                            return a - b
                        },
                    )

                    if (
                        bibleMetadata[book]?.chapters?.at(parseInt(chapter) - 1)
                            ?.length === uniqueVerses.length
                    ) {
                        return chapter
                    }

                    const sortedVerseSegments = uniqueVerses.reduce<number[][]>(
                        (acc, verse) => {
                            const lastNumberInLastSegment = acc?.at(-1)?.at(-1)

                            if (lastNumberInLastSegment === undefined) {
                                return [[verse]]
                            }

                            if (verse === lastNumberInLastSegment + 1) {
                                acc.at(-1)?.push(verse)
                            } else {
                                acc.push([verse])
                            }

                            return acc
                        },
                        [[]],
                    )

                    return `${chapter}:${sortedVerseSegments
                        .map(segment => {
                            if (segment.length === 1) {
                                return segment[0]
                            }
                            return `${segment[0]}-${segment.at(-1)}`
                        })
                        .join(',')}`
                })
                .join(', ')

            return `${toProperCase(
                book.split('_').join(' '),
            )} ${chaptersString}`
        })

    return `${books.join(', ')} `
}

export type BookSummary = {
    book: string
    label: string
    totalVerses: number
    typedVerses: number
}

export type ChapterOverview = {
    chapter: number
    verses: number
    typedVerses: number
    percentage: number
}

export type BookOverview = {
    book: string
    label: string
    percentage: number
    chapters: ChapterOverview[]
}

function getBookOverview(typingSessions: TypingSession[]): BookOverview[] {
    const bibleMetadata = getBibleMetadata()

    let bookVerses: Record<
        Partial<(typeof bookSchema.options)[number]>,
        Record<number, Record<number, TypedVerse>>
    > = {} as never
    for (const typingSession of typingSessions) {
        for (const verse of typingSession.typedVerses) {
            if (bookVerses[verse.book] == null) {
                bookVerses[verse.book] = {}
            }
            if (bookVerses[verse.book][verse.chapter] == null) {
                bookVerses[verse.book][verse.chapter] = {}
            }
            if (bookVerses[verse.book][verse.chapter]) {
                bookVerses = {
                    ...bookVerses,
                    [verse.book]: {
                        ...bookVerses[verse.book],
                        [verse.chapter]: {
                            ...bookVerses[verse.book][verse.chapter],
                            [verse.verse]: verse,
                        },
                    },
                }
            }
        }
    }

    return Object.entries(bibleMetadata).map(([book, content]) => {
        const validatedBook = bookSchema.parse(book)
        let totalVersesCount = 0
        let typedVersesCount = 0
        return {
            book,
            chapters: content.chapters.map(
                ({ length: chapterLength }, chapterIndex) => {
                    const typedVerses =
                        bookVerses[validatedBook]?.[chapterIndex + 1]
                    const numberOfTypedVerses = Object.keys(
                        typedVerses ?? {},
                    ).length
                    totalVersesCount += chapterLength
                    typedVersesCount += numberOfTypedVerses
                    return {
                        chapter: chapterIndex + 1,
                        verses: chapterLength,
                        typedVerses: numberOfTypedVerses,
                        percentage: Math.round(
                            (numberOfTypedVerses / chapterLength) * 100,
                        ),
                        alt:
                            Math.floor(
                                (numberOfTypedVerses / chapterLength) * 10000,
                            ) / 100,
                    }
                },
            ),
            label: passageReferenceSchema.parse(
                toPluralBookForm(validatedBook),
            ),
            percentage: Math.round((typedVersesCount / totalVersesCount) * 100),
            alt:
                Math.floor((typedVersesCount / totalVersesCount) * 10000) / 100,
        }
    })
}

const typingSessionSummarySchema = typingSessionSchema.transform(
    typingSession => ({
        numberOfVersesTyped: typingSession.typedVerses.length,
        updatedAt: typingSession.updatedAt,
        createdAt: typingSession.createdAt,
        location: typingSessionToString(typingSession),
    }),
)

export type TypingSessionSummary = z.infer<typeof typingSessionSummarySchema>

export const typingSessionRouter = createTRPCRouter({
    getOrCreateTypingSession: protectedProcedure.query(
        async ({
            ctx: { db, session, repositories },
        }): Promise<TypingSession> => {
            const lastTypingSession =
                await repositories.typingSession.getOneOrNull({
                    userId: session.user.id,
                })

            if (
                lastTypingSession &&
                differenceInMinutes(
                    subMinutes(new Date(), 15),
                    lastTypingSession?.updatedAt,
                ) < 15
            ) {
                return lastTypingSession
            }

            await db.insert(typingSessions).values({ userId: session.user.id })

            const newTypingSession = await repositories.typingSession.getOne({
                id: sql`LAST_INSERT_ID
        ()`,
            })

            return newTypingSession
        },
    ),
    addTypedVerseToSession: protectedProcedure
        .input(addTypedVerseInputSchema)
        .mutation(
            async ({
                ctx: { db, session, repositories },
                input,
            }): Promise<TypingSession> => {
                let typingSession = await repositories.typingSession.getOne({
                    id: input.typingSessionId,
                })

                await db
                    .update(typingSessions)
                    .set({
                        updatedAt: sql`CURRENT_TIMESTAMP(3)`,
                    })
                    .where(eq(typingSessions.id, input.typingSessionId))
                await db.insert(typedVerses).values({
                    userId: session.user.id,
                    ...input,
                })

                typingSession = await repositories.typingSession.getOne({
                    userId: session.user.id,
                })

                return typingSession
            },
        ),
    getHistoryOverview: protectedProcedure.query(
        async ({
            ctx: { db, session, repositories },
        }): Promise<BookOverview[]> => {
            const typingSessions = await repositories.typingSession.getMany({
                userId: session.user.id,
            })

            return getBookOverview(typingSessions)
        },
    ),
    getLog: protectedProcedure.query(
        async ({
            ctx: { db, session, repositories },
        }): Promise<TypingSessionSummary[]> => {
            const typingSessions = await repositories.typingSession.getMany({
                userId: session.user.id,
            })

            return typingSessions
                .map(a => typingSessionSummarySchema.parse(a))
                .filter(a => a.numberOfVersesTyped > 0)
        },
    ),
})
