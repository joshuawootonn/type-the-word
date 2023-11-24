import { createTRPCRouter, protectedProcedure } from '../trpc'
import { typedVerses, typingSessions } from '~/server/db/schema'
import { eq, sql } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import { differenceInMinutes, subMinutes } from 'date-fns'
import { TypingSession } from '~/server/repositories/typingSession.repository'

const addTypedVerseInputSchema = createInsertSchema(typedVerses).omit({
    userId: true,
    id: true,
})

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
})
