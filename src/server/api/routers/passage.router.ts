import { z } from 'zod'
import { env } from '~/env.mjs'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { parseChapter, ParsedPassage } from '~/lib/parseEsv'
import { passageReferenceSchema } from '~/lib/passageReference'
import { stringToPassageObject } from '~/lib/passageObject'

import psalm23 from '~/server/psalm-23.json'
import james1 from '~/server/james-1.json'
import genesis1 from '~/server/genesis-1.json'
import { passageResponse } from '~/server/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { isBefore, subDays } from 'date-fns'

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

export const passageRouter = createTRPCRouter({
    passage: publicProcedure
        .input(
            z.object({
                reference: passageReferenceSchema,
                savePassageResponseToDatabase: z
                    .boolean()
                    .optional()
                    .default(false),
            }),
        )
        .query(async ({ input, ctx: { db } }): Promise<ParsedPassage> => {
            const passageData = stringToPassageObject.parse(input.reference)

            const verseSuffix =
                passageData.firstVerse && passageData.lastVerse
                    ? passageData.firstVerse === passageData.lastVerse
                        ? `:${passageData.firstVerse}`
                        : `:${passageData.firstVerse}-${passageData.lastVerse}`
                    : ''

            let data: unknown
            if (passageData.book === 'psalm' && passageData.chapter === 23) {
                data = psalm23
            } else if (
                passageData.book === 'james' &&
                passageData.chapter === 1
            ) {
                data = james1
            } else if (
                passageData.book === 'genesis' &&
                passageData.chapter === 1
            ) {
                data = genesis1
            } else {
                const response = await fetch(
                    `https://api.esv.org/v3/passage/html/?q=${passageData.book
                        .split('_')
                        .join(' ')} ${passageData.chapter}${verseSuffix}`,
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

                data = await response.json()

                const referenceIsEntireChapter = !input.reference.includes(':')

                if (
                    input.savePassageResponseToDatabase &&
                    passageData.chapter != null &&
                    referenceIsEntireChapter
                ) {
                    const existingPassageResponse =
                        await db.query.passageResponse.findFirst({
                            where: and(
                                eq(
                                    passageResponse.chapter,
                                    passageData.chapter,
                                ),
                                eq(passageResponse.book, passageData.book),
                                eq(passageResponse.translation, 'esv'),
                            ),
                        })

                    if (existingPassageResponse == null) {
                        await db.insert(passageResponse).values({
                            response: data,
                            book: passageData.book,
                            chapter: passageData.chapter,
                            translation: 'esv',
                        })
                    } else if (
                        isBefore(
                            existingPassageResponse.updatedAt,
                            subDays(new Date(), 31),
                        )
                    ) {
                        await db
                            .update(passageResponse)
                            .set({
                                response: data,
                                updatedAt: sql`CURRENT_TIMESTAMP(3)`,
                            })
                            .where(
                                eq(
                                    passageResponse.id,
                                    existingPassageResponse.id,
                                ),
                            )
                    }
                }
            }

            const parsedData = passageSchema.parse(data)

            return parseChapter(parsedData.passages.at(0) ?? '')
        }),
})
