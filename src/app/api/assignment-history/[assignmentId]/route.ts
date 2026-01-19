import { getServerSession } from "next-auth"
import { NextRequest } from "next/server"
import { z } from "zod"

import { authOptions } from "~/server/auth"

import { getAssignmentHistory } from "./getAssignmentHistory"

const uuidSchema = z.string().uuid()

export async function GET(
    _request: NextRequest,
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

    try {
        const data = await getAssignmentHistory(session.user.id, assignmentId)
        return Response.json({ data }, { status: 200 })
    } catch (_) {
        return Response.json({ error: "Assignment not found" }, { status: 404 })
    }
}
