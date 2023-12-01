import { createTRPCRouter, protectedProcedure } from '../trpc'
import { typedVerses, typingSessions } from '~/server/db/schema'
import { eq, sql } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import { differenceInMinutes, subMinutes } from 'date-fns'
import {
    TypedVerse,
    TypingSession,
    typingSessionSchema,
} from '~/server/repositories/typingSession.repository'
import { z } from 'zod'
import metadata from '../../bibleMetadata.json'

const addTypedVerseInputSchema = createInsertSchema(typedVerses).omit({
    userId: true,
    id: true,
})

const bibleMetadataSchema = z.record(
    z.enum(typedVerses.book.enumValues),
    z.object({
        chapters: z.array(z.object({ length: z.number() })),
        testament: z.enum(['OT', 'NT']),
        name: z.string(),
    }),
)
type BibleMetadata = z.infer<typeof bibleMetadataSchema>

function getBibleMetadata(): BibleMetadata {
    const bibleMetadata = bibleMetadataSchema.parse(metadata)

    return bibleMetadata
}

function toProperCase(str: string) {
    return str.replace(/\w\S*/g, function (txt: string) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    })
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
    totalVerses: number
    typedVerses: number
}

function getBookSummary(typingSessions: TypingSession[]): BookSummary[] {
    const bibleMetadata = getBibleMetadata()

    const books = Array.from(
        new Set(
            typingSessions.reduce<TypedVerse['book'][]>(
                (acc, curr) => [
                    ...acc,
                    ...curr.typedVerses.map(verse => verse.book),
                ],
                [],
            ),
        ),
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
            const typedVersesInThisBook = typingSessions.reduce<TypedVerse[]>(
                (acc, curr) => [
                    ...acc,
                    ...curr.typedVerses.filter(verse => verse.book === book),
                ],
                [],
            )
            const versesInCurrentBook =
                bibleMetadata[book]?.chapters.reduce(
                    (acc, curr) => acc + curr.length,
                    0,
                ) ?? 0

            return {
                book: toProperCase(book),
                totalVerses: versesInCurrentBook,
                typedVerses: typedVersesInThisBook.length,
            }
        })

    return books
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
                id: sql`LAST_INSERT_ID()`,
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
    getHistorySummary: protectedProcedure.query(
        async ({
            ctx: { db, session, repositories },
        }): Promise<BookSummary[]> => {
            const typingSessions = await repositories.typingSession.getMany({
                userId: session.user.id,
            })

            return getBookSummary(typingSessions)
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
