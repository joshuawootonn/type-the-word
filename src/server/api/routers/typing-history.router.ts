import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TypedVerse } from '~/server/repositories/typingSession.repository'
import { z } from 'zod'
import { booksSchema, chaptersSchema } from '~/server/db/schema'

export const chapterHistoryRouter = createTRPCRouter({
    getChapterHistory: protectedProcedure
        .input(
            z.object({
                chapter: chaptersSchema,
                book: booksSchema,
            }),
        )
        .query(
            async ({
                ctx: { session, repositories },
                input,
            }): Promise<{ verses: Record<number, TypedVerse[]> }> => {
                const typingSessions = await repositories.typingSession.getMany(
                    {
                        userId: session.user.id,
                        typedVerse: {
                            book: input.book,
                            translation: 'esv',
                            chapter: input.chapter,
                        },
                    },
                )

                const verses: Record<number, TypedVerse[]> = {}

                for (const session of typingSessions) {
                    for (const verse of session.typedVerses) {
                        if (
                            verse.book !== input.book ||
                            verse.chapter !== input.chapter
                        ) {
                            continue
                        }

                        const acc = verses[verse.verse] ?? []
                        verses[verse.verse] = [...acc, verse]
                    }
                }

                return {
                    verses,
                }
            },
        ),
})
