import { z } from 'zod'
import { env } from '~/env.mjs'
import { createTRPCRouter, publicProcedure } from '../trpc'
import { parseChapter, ParsedPassage } from '~/lib/parseEsv'
import { decodedUrlSchema } from '~/lib/url'

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
        .input(decodedUrlSchema)
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
})
