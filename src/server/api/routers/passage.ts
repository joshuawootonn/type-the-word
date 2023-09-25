import { z } from 'zod'

import { env } from '~/env.mjs'

import { createTRPCRouter, publicProcedure } from '../trpc'

const passageSchema = z.object({
    query: z.string(),
    canonical: z.string(),
    parsed: z.array(z.array(z.number())),
    passageMeta: z.array(
        z.object({
            canonical: z.string(),
            ['chapter_start']: z.tuple([z.number(), z.number()]),
            ['chapter_end']: z.tuple([z.number(), z.number()]),
            ['prev_verse']: z.number(),
            ['next_verse']: z.number(),
            ['prev_chapter']: z.tuple([z.number(), z.number()]),
            ['next_chapter']: z.tuple([z.number(), z.number()]),
        }),
    ),
    passages: z.array(z.string()),
})

export type PassageSchema = z.infer<typeof passageSchema>

export const passageRouter = createTRPCRouter({
    passage: publicProcedure
        .input(z.string())
        .query(async ({ input }): Promise<PassageSchema> => {
            const response = await fetch(
                `https://api.esv.org/v3/passage/text/?q=John+11:35`,
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

            return response.json()
        }),
})
