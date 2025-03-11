import { z } from 'zod'
import { env } from '~/env.mjs'
import { parseChapter } from '~/lib/parseEsv'
import { PassageObject, stringToPassageObject } from '~/lib/passageObject'
import fs from 'fs'
import path from 'path'

import { passageResponse } from '~/server/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { isAfter, isBefore, subDays } from 'date-fns'
import { db } from '~/server/db'
import {
    PassageSegment,
    passageSegmentSchema,
    toPassageSegment,
} from '~/lib/passageSegment'
import { passageReferenceSchema } from '~/lib/passageReference'
import { createESVURL } from './create-esv-url'

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

export const dynamic = 'force-dynamic' // defaults to auto

function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message
    return String(error)
}

export async function GET(
    _: Request,
    { params }: { params: { passage?: string } },
) {
    let reference: PassageSegment

    try {
        reference = passageSegmentSchema.parse(params?.passage)
    } catch (e: unknown) {
        return Response.json(
            {
                error: getErrorMessage(e),
            },
            {
                status: 400,
            },
        )
    }
    let passageData: PassageObject

    try {
        passageData = stringToPassageObject.parse(
            passageReferenceSchema.parse(params?.passage),
        )
    } catch (e: unknown) {
        return Response.json(
            {
                error: getErrorMessage(e),
            },
            {
                status: 400,
            },
        )
    }

    const includesVerses = passageData.lastVerse != null

    if (
        !includesVerses &&
        [
            'genesis_1',
            'psalm_23',
            'james_1',
            'song_of_solomon_1',
            'song_of_solomon_2',
            'song_of_solomon_3',
            'song_of_solomon_4',
            'song_of_solomon_5',
            'song_of_solomon_6',
            'song_of_solomon_7',
            'song_of_solomon_8',
        ].includes(toPassageSegment(passageData.book, passageData.chapter))
    ) {
        const filePath = path.join(
            process.cwd(),
            '/src/server',
            `${toPassageSegment(passageData.book, passageData.chapter)}.html`,
        )
        try {
            const content = fs.readFileSync(filePath, {
                encoding: 'utf8',
            })
            return Response.json(
                { data: parseChapter(content) },
                { status: 200 },
            )
        } catch (error) {
            console.warn(
                `Tried to read passage: (${filePath}) and failed with error:`,
                error,
            )
        }
    }

    // Only optimize whole chapter fetches
    if (passageData.chapter != null && includesVerses) {
        console.log(
            "Passage route cache MISS: reference isn't entire chapter",
            { reference },
        )
        const response = await fetch(createESVURL(passageData), {
            headers: {
                Authorization: `Token ${env.CROSSWAY_SECRET}`,
            },
        })
        const data: unknown = await response.json()
        const parsedData = passageSchema.parse(data)

        return Response.json(
            { data: parseChapter(parsedData.passages.at(0) ?? '') },
            { status: 200 },
        )
    }

    const existingPassageResponse = await db.query.passageResponse.findFirst({
        where: and(
            eq(passageResponse.chapter, passageData.chapter),
            eq(passageResponse.book, passageData.book),
            eq(passageResponse.translation, 'esv'),
        ),
    })

    if (
        existingPassageResponse != null &&
        isAfter(existingPassageResponse.updatedAt, subDays(new Date(), 31))
    ) {
        console.log(
            'Passage route cache HIT: reference is entire chapter and less than a month old',
            { reference },
        )
        const parsedData = passageSchema.parse(existingPassageResponse.response)
        return Response.json(
            { data: parseChapter(parsedData.passages.at(0) ?? '') },
            { status: 200 },
        )
    }

    const response = await fetch(createESVURL(passageData), {
        headers: {
            Authorization: `Token ${env.CROSSWAY_SECRET}`,
        },
    })

    const data: unknown = await response.json()
    const parsedData = passageSchema.parse(data)
    if (existingPassageResponse == null) {
        console.log(
            "Passage route cache MISS: reference is entire chapter but entry doesn't exist",
            { reference },
        )
        await db.insert(passageResponse).values({
            response: data,
            book: passageData.book,
            chapter: passageData.chapter,
            translation: 'esv',
        })
    } else if (
        isBefore(existingPassageResponse.updatedAt, subDays(new Date(), 31))
    ) {
        console.log(
            'Passage route cache MISS: reference is entire chapter but entry is expired',
            { reference },
        )
        await db
            .update(passageResponse)
            .set({
                response: data,
                updatedAt: sql`CURRENT_TIMESTAMP(3)`,
            })
            .where(eq(passageResponse.id, existingPassageResponse.id))
    }
    return Response.json(
        { data: parseChapter(parsedData.passages.at(0) ?? '') },
        { status: 200 },
    )
}
