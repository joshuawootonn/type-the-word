import { getServerSession } from "next-auth"
import { NextRequest } from "next/server"

import { Translation } from "~/lib/parseEsv"
import { segmentToPassageObject } from "~/lib/passageObject"
import { authOptions } from "~/server/auth"

import { getChapterHistory } from "./getChapterHistory"

export type ChapterLog = {
    location: string[]
    createdAt: Date
}

export type ChapterHistory = {
    verses: Record<number, boolean>
    chapterLogs: ChapterLog[]
}

export const dynamic = "force-dynamic"

const validTranslations: Translation[] = [
    "esv",
    "bsb",
    "nlt",
    "niv",
    "csb",
    "nkjv",
    "nasb",
    "ntv",
    "msg",
]

function parseTranslation(value: string | undefined | null): Translation {
    if (value && validTranslations.includes(value as Translation)) {
        return value as Translation
    }
    return "esv"
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ passage?: string }> },
) {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { passage } = await params
    let passageObject

    try {
        passageObject = segmentToPassageObject(passage)
    } catch (_) {
        return Response.json(
            {
                error: "Invalid reference route segement",
            },
            { status: 400 },
        )
    }

    const translation = parseTranslation(
        request.nextUrl.searchParams.get("translation"),
    )

    const data = await getChapterHistory(
        session.user.id,
        passageObject,
        translation,
    )
    return Response.json({ data }, { status: 200 })
}
