import { z } from 'zod'
import { env } from '~/env.mjs'
import { parseChapter } from '~/lib/parseEsv'
import { PassageObject, stringToPassageObject } from '~/lib/passageObject'

import psalm23 from '~/server/psalm-23.json'
import james1 from '~/server/james-1.json'
import genesis1 from '~/server/genesis-1.json'
import { passageResponse } from '~/server/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { isAfter, isBefore, subDays } from 'date-fns'
import { db } from '~/server/db'
import { PassageSegment, passageSegmentSchema } from '~/lib/passageSegment'

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
        passageData = stringToPassageObject.parse(params?.passage)
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

    const verseSuffix =
        passageData.firstVerse && passageData.lastVerse
            ? passageData.firstVerse === passageData.lastVerse
                ? `:${passageData.firstVerse}`
                : `:${passageData.firstVerse}-${passageData.lastVerse}`
            : ''

    if (passageData.book === 'psalm' && passageData.chapter === 23) {
        return Response.json(
            { data: parseChapter(psalm23.passages.at(0) ?? '') },
            { status: 200 },
        )
    } else if (passageData.book === 'james' && passageData.chapter === 1) {
        return Response.json(
            { data: parseChapter(james1.passages.at(0) ?? '') },
            { status: 200 },
        )
    } else if (passageData.book === 'genesis' && passageData.chapter === 1) {
        return Response.json(
            { data: parseChapter(genesis1.passages.at(0) ?? '') },
            { status: 200 },
        )
    }

    const referenceIncludesVerses = reference.includes(':')
    // Only optimize whole chapter fetches
    if (passageData.chapter != null && referenceIncludesVerses) {
        console.log(
            "Passage route cache MISS: reference isn't entire chapter",
            { reference },
        )
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
