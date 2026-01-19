import { getServerSession } from "next-auth"
import { NextRequest } from "next/server"

import { authOptions } from "~/server/auth"
import { db } from "~/server/db"
import { TypedVerseRepository } from "~/server/repositories/typedVerse.repository"
import { TypedVerse } from "~/server/repositories/typingSession.repository"

export type LastVerse = TypedVerse

export const dynamic = "force-dynamic"

export async function GET(
    _: NextRequest,
    { params: _params }: { params: Promise<{ passage?: string }> },
) {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const typedVerseRepository = new TypedVerseRepository(db)
    const verse = await typedVerseRepository.getOneOrNull({
        userId: session.user.id,
    })

    return Response.json({ data: verse }, { status: 200 })
}
