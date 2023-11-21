import { z } from 'zod'
import { env } from '~/env.mjs'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { parseChapter, ParsedPassage } from '~/lib/parseEsv'
import { typedVerses, typingSessions } from '~/server/db/schema'
import { eq, sql } from 'drizzle-orm'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

const passageSchema = z.object({
    query: z.string(),
    canonical: z.string(),
    parsed: z.array(z.array(z.number())),
    passage_meta: z.array(
        z.object({
            canonical: z.string(),
            ['chapter_start']: z.tuple([z.number(), z.number()]),
            ['chapter_end']: z.tuple([z.number(), z.number()]),
            ['prev_verse']: z.number().nullable(),
            ['next_verse']: z.number().nullable(),
            ['prev_chapter']: z.tuple([z.number(), z.number()]).nullable(),
            ['next_chapter']: z.tuple([z.number(), z.number()]).nullable(),
        }),
    ),
    passages: z.array(z.string()),
})

const typingSessionSchema = createSelectSchema(typingSessions)
type TypingSession = z.infer<typeof typingSessionSchema>

const addTypedVerseInputSchema = createInsertSchema(typedVerses).omit({
    userId: true,
    id: true,
})

export const passageRouter = createTRPCRouter({
    passage: publicProcedure
        .input(z.string())
        .query(async ({ input }): Promise<ParsedPassage> => {
            const response = await fetch(
                `https://api.esv.org/v3/passage/html/?q=${input}`,
                {
                    headers: {
                        Authorization: `Token ${env.CROSSWAY_SECRET}`,
                    },
                },
            )

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch status text with ${response.status}`,
                )
            }

            const data: unknown = await response.json()
            const parsedData = passageSchema.parse(data)

            return parseChapter(parsedData.passages.at(0) ?? '')
        }),

    getTypingSession: protectedProcedure.query(
        async ({ ctx: { db, session } }): Promise<TypingSession> => {
            const lastTypingSession = await db.query.typingSessions.findFirst({
                with: {
                    typedVerses: true,
                },
                where: eq(typingSessions.userId, session.user.id),
            })
            if (lastTypingSession != null) {
                return lastTypingSession
            }

            await db.insert(typingSessions).values({ userId: session.user.id })
            const newTypingSession = await db.query.typingSessions.findFirst({
                where: eq(typingSessions.id, sql`LAST_INSERT_ID()`),
            })

            if (newTypingSession == null) {
                throw new Error('Typing session not found')
            }

            return newTypingSession
        },
    ),

    addTypedVerseToSession: protectedProcedure
        .input(addTypedVerseInputSchema)
        .mutation(
            async ({ ctx: { db, session }, input }): Promise<TypingSession> => {
                let typingSession = await db.query.typingSessions.findFirst({
                    where: eq(typingSessions.id, input.typingSessionId),
                })

                if (typingSession == null) {
                    throw new Error('Typing session not found')
                }

                console.log(input)
                await db.insert(typedVerses).values({
                    userId: session.user.id,
                    ...input,
                })

                typingSession = await db.query.typingSessions.findFirst({
                    with: {
                        typedVerses: true,
                    },
                    where: eq(typingSessions.userId, session.user.id),
                })
                if (typingSession == null) {
                    throw new Error('Typing session not found')
                }

                return typingSession
            },
        ),
})
