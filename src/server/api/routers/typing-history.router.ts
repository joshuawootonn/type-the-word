import { createTRPCRouter, protectedProcedure } from '../trpc'
import {
    TypedVerse,
    typingSessionSchema,
} from '~/server/repositories/typingSession.repository'
import { z } from 'zod'
import { booksSchema, chaptersSchema } from '~/server/db/schema'

const chapterHistorySchema = z.array(typingSessionSchema).transform(t => {
    const verses: Record<number, TypedVerse[]> = {}

    for (const session of t) {
        for (const verse of session.typedVerses) {
            const acc = verses[verse.verse] ?? []
            verses[verse.verse] = [...acc, verse]
        }
    }

    return {
        verses,
    }
})

type ChapterHistory = z.infer<typeof chapterHistorySchema>

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
            }): Promise<ChapterHistory> => {
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

                return chapterHistorySchema.parse(typingSessions)
            },
        ),
})
