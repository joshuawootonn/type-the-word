import { createTRPCRouter, protectedProcedure } from '../trpc'
import { typedVerses, typingSessions } from '~/server/db/schema'
import { eq, sql } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import { differenceInMinutes, subMinutes } from 'date-fns'
import {
    TypingSession,
    typingSessionSchema,
} from '~/server/repositories/typingSession.repository'
import { z } from 'zod'

const addTypedVerseInputSchema = createInsertSchema(typedVerses).omit({
    userId: true,
    id: true,
})

function typingSessionToString(typingSession: TypingSession) {
    const books = Array.from(
        new Set(typingSession.typedVerses.map(verse => verse.book)),
    )
    // const dd
    // typingSession.typedVerses.reduce((acc, verse) => {
    //     if (acc[verse.book] == null) {
    //         acc[verse.book] = {}
    //     }
    // }, {})
    return `${books.join(' ')} `
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
                    lastTypingSession?.createdAt,
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

    getLog: protectedProcedure.query(
        async ({
            ctx: { db, session, repositories },
        }): Promise<TypingSessionSummary[]> => {
            const typingSessions = await repositories.typingSession.getMany({
                userId: session.user.id,
            })

            return typingSessions.map(a => typingSessionSummarySchema.parse(a))
        },
    ),
})
