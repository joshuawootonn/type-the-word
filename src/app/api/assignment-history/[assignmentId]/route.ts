import { getServerSession } from "next-auth"
import { NextRequest } from "next/server"
import { z } from "zod"

import { authOptions } from "~/server/auth"

import { getAssignmentHistory } from "./getAssignmentHistory"

const uuidSchema = z.string().uuid()

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ assignmentId: string }> },
) {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assignmentId } = await params

    if (uuidSchema.safeParse(assignmentId).success === false) {
        return Response.json(
            { error: "Invalid assignment id" },
            { status: 400 },
        )
    }

    const chapterParam = request.nextUrl.searchParams.get("chapter")
    let chapter: number | undefined = undefined
    if (chapterParam != null) {
        const parsedChapter = Number.parseInt(chapterParam, 10)
        if (Number.isNaN(parsedChapter) || parsedChapter < 1) {
            return Response.json(
                { error: "Invalid chapter query param" },
                { status: 400 },
            )
        }
        chapter = parsedChapter
    }

    try {
        const data = await getAssignmentHistory(session.user.id, assignmentId, {
            chapter,
        })
        return Response.json({ data }, { status: 200 })
    } catch (_) {
        return Response.json({ error: "Assignment not found" }, { status: 404 })
    }
}
