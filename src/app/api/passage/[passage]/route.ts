import { isAfter, isBefore, subDays } from "date-fns"
import { and, eq, sql } from "drizzle-orm"
import fs from "fs"
import path from "path"
import { z } from "zod"

import { env } from "~/env.mjs"
import { parseChapter, Translation } from "~/lib/parseEsv"
import { PassageObject, stringToPassageObject } from "~/lib/passageObject"
import { passageReferenceSchema } from "~/lib/passageReference"
import {
    PassageSegment,
    passageSegmentSchema,
    toPassageSegment,
} from "~/lib/passageSegment"
import { db } from "~/server/db"
import { passageResponse } from "~/server/db/schema"

import { createApiBibleURL } from "./create-api-bible-url"
import { createESVURL } from "./create-esv-url"
import { parseApiBibleChapter } from "./parse-api-bible"

const esvPassageSchema = z.object({
    query: z.string(),
    canonical: z.string(),
    parsed: z.array(z.array(z.number())),
    passage_meta: z.array(
        z.object({
            canonical: z.string(),
            ["chapter_start"]: z.tuple([z.number(), z.number()]),
            ["chapter_end"]: z.tuple([z.number(), z.number()]),
            ["prev_verse"]: z.number().nullable(),
            ["next_verse"]: z.number().nullable(),
            ["prev_chapter"]: z.tuple([z.number(), z.number()]).nullable(),
            ["next_chapter"]: z.tuple([z.number(), z.number()]).nullable(),
        }),
    ),
    passages: z.array(z.string()),
})

const apiBiblePassageSchema = z.object({
    data: z.object({
        id: z.string(),
        bibleId: z.string(),
        orgId: z.string(),
        bookId: z.string(),
        chapterIds: z.array(z.string()),
        reference: z.string(),
        content: z.string(),
        verseCount: z.number(),
        copyright: z.string(),
    }),
    // meta is optional and we don't need to validate its structure
    meta: z.unknown().optional(),
})

const translationSchema = z
    .enum(["esv", "bsb", "nlt", "niv", "csb", "nkjv", "nasb", "ntv", "msg"])
    .default("esv")

export const dynamic = "force-dynamic" // defaults to auto

function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message
    return String(error)
}

async function fetchMockPassageForE2E(
    passageData: PassageObject,
    translation: Translation,
) {
    const segment = toPassageSegment(passageData.book, passageData.chapter)
    const preferredTranslation = translation === "esv" ? "nlt" : translation

    const apiBibleFixturePath = path.join(
        process.cwd(),
        "/src/server/api-bible/responses",
        preferredTranslation,
        `${segment}.html`,
    )

    try {
        const fixture = fs.readFileSync(apiBibleFixturePath, "utf8")
        return {
            data: await parseApiBibleChapter(fixture, preferredTranslation, ""),
        }
    } catch (_error) {
        // Fall back to ESV fixture if API-Bible fixture is unavailable.
    }

    const esvFixturePath = path.join(
        process.cwd(),
        "/src/server",
        `${segment}.html`,
    )
    const esvFixture = fs.readFileSync(esvFixturePath, "utf8")
    return { data: await parseChapter(esvFixture) }
}

async function fetchESVPassage(
    passageData: PassageObject,
    reference: PassageSegment,
) {
    const includesVerses = passageData.lastVerse != null

    // Check for local cached files (ESV only)
    if (
        !includesVerses &&
        [
            "genesis_1",
            "psalm_23",
            "james_1",
            "song_of_solomon_1",
            "song_of_solomon_2",
            "song_of_solomon_3",
            "song_of_solomon_4",
            "song_of_solomon_5",
            "song_of_solomon_6",
            "song_of_solomon_7",
            "song_of_solomon_8",
        ].includes(toPassageSegment(passageData.book, passageData.chapter))
    ) {
        const filePath = path.join(
            process.cwd(),
            "/src/server",
            `${toPassageSegment(passageData.book, passageData.chapter)}.html`,
        )
        try {
            const content = fs.readFileSync(filePath, {
                encoding: "utf8",
            })
            return { data: await parseChapter(content) }
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
        const parsedData = esvPassageSchema.parse(data)

        return { data: await parseChapter(parsedData.passages.at(0) ?? "") }
    }

    const existingPassageResponse = await db.query.passageResponse.findFirst({
        where: and(
            eq(passageResponse.chapter, passageData.chapter),
            eq(passageResponse.book, passageData.book),
            eq(passageResponse.translation, "esv"),
        ),
    })

    if (
        existingPassageResponse != null &&
        isAfter(existingPassageResponse.updatedAt, subDays(new Date(), 31))
    ) {
        console.log(
            "Passage route cache HIT: reference is entire chapter and less than a month old",
            {
                reference,
            },
        )
        const parsedData = esvPassageSchema.parse(
            existingPassageResponse.response,
        )
        return { data: await parseChapter(parsedData.passages.at(0) ?? "") }
    }

    const response = await fetch(createESVURL(passageData), {
        headers: {
            Authorization: `Token ${env.CROSSWAY_SECRET}`,
        },
    })

    const data: unknown = await response.json()
    const parsedData = esvPassageSchema.parse(data)
    if (existingPassageResponse == null) {
        console.log(
            "Passage route cache MISS: reference is entire chapter but entry doesn't exist",
            {
                reference,
            },
        )
        await db.insert(passageResponse).values({
            response: data,
            book: passageData.book,
            chapter: passageData.chapter,
            translation: "esv",
        })
    } else if (
        isBefore(existingPassageResponse.updatedAt, subDays(new Date(), 31))
    ) {
        console.log(
            "Passage route cache MISS: reference is entire chapter but entry is expired",
            {
                reference,
            },
        )
        await db
            .update(passageResponse)
            .set({
                response: data,
                updatedAt: sql`CURRENT_TIMESTAMP(3)`,
            })
            .where(eq(passageResponse.id, existingPassageResponse.id))
    }
    return { data: await parseChapter(parsedData.passages.at(0) ?? "") }
}

async function fetchApiBiblePassage(
    passageData: PassageObject,
    reference: PassageSegment,
    translation: Exclude<Translation, "esv">,
) {
    const includesVerses = passageData.lastVerse != null

    // Only optimize whole chapter fetches for caching
    if (passageData.chapter != null && includesVerses) {
        console.log(
            `${translation.toUpperCase()} Passage route cache MISS: reference isn't entire chapter`,
            { reference },
        )
        const response = await fetch(
            createApiBibleURL(passageData, translation),
            {
                headers: {
                    "api-key": env.API_BIBLE_API_KEY,
                },
            },
        )
        const data: unknown = await response.json()
        const parsedData = apiBiblePassageSchema.parse(data)

        return {
            data: await parseApiBibleChapter(
                parsedData.data.content,
                translation,
                parsedData.data.copyright,
            ),
        }
    }

    const existingPassageResponse = await db.query.passageResponse.findFirst({
        where: and(
            eq(passageResponse.chapter, passageData.chapter),
            eq(passageResponse.book, passageData.book),
            eq(passageResponse.translation, translation),
        ),
    })

    if (
        existingPassageResponse != null &&
        isAfter(existingPassageResponse.updatedAt, subDays(new Date(), 31))
    ) {
        console.log(
            `${translation.toUpperCase()} Passage route cache HIT: reference is entire chapter and less than a month old`,
            { reference },
        )
        const parsedData = apiBiblePassageSchema.parse(
            existingPassageResponse.response,
        )
        return {
            data: await parseApiBibleChapter(
                parsedData.data.content,
                translation,
                parsedData.data.copyright,
            ),
        }
    }

    const response = await fetch(createApiBibleURL(passageData, translation), {
        headers: {
            "api-key": env.API_BIBLE_API_KEY,
        },
    })

    const data: unknown = await response.json()
    const parsedData = apiBiblePassageSchema.parse(data)
    if (existingPassageResponse == null) {
        console.log(
            `${translation.toUpperCase()} Passage route cache MISS: reference is entire chapter but entry doesn't exist`,
            { reference },
        )
        await db.insert(passageResponse).values({
            response: data,
            book: passageData.book,
            chapter: passageData.chapter,
            translation: translation,
        })
    } else if (
        isBefore(existingPassageResponse.updatedAt, subDays(new Date(), 31))
    ) {
        console.log(
            `${translation.toUpperCase()} Passage route cache MISS: reference is entire chapter but entry is expired`,
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
    return {
        data: await parseApiBibleChapter(
            parsedData.data.content,
            translation,
            parsedData.data.copyright,
        ),
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ passage?: string }> },
) {
    const { passage } = await params

    // Parse translation from query params
    const url = new URL(request.url)
    const translationParam = url.searchParams.get("translation")
    let translation: Translation

    try {
        // Pass undefined instead of null so zod's .default() works
        translation = translationSchema.parse(translationParam ?? undefined)
    } catch (_: unknown) {
        return Response.json(
            {
                error: `Invalid translation. Must be one of: esv, bsb, nlt, niv, csb, nkjv, nasb, ntv, msg`,
            },
            {
                status: 400,
            },
        )
    }

    let reference: PassageSegment

    try {
        reference = passageSegmentSchema.parse(passage)
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
            passageReferenceSchema.parse(passage),
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

    try {
        if (process.env.E2E_MOCK_PASSAGE === "1") {
            const result = await fetchMockPassageForE2E(
                passageData,
                translation,
            )
            return Response.json(result, { status: 200 })
        }

        if (translation === "esv") {
            const result = await fetchESVPassage(passageData, reference)
            return Response.json(result, { status: 200 })
        } else {
            const result = await fetchApiBiblePassage(
                passageData,
                reference,
                translation,
            )
            return Response.json(result, { status: 200 })
        }
    } catch (error: unknown) {
        console.error("Error fetching passage:", error)
        return Response.json(
            {
                error: getErrorMessage(error),
            },
            {
                status: 500,
            },
        )
    }
}
