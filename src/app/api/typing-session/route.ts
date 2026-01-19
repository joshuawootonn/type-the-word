import { getServerSession } from "next-auth"
import { NextRequest } from "next/server"

import { authOptions } from "~/server/auth"

import { getOrCreateTypingSession } from "./getOrCreateTypingSession"

export const dynamic = "force-dynamic" // defaults to auto

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const assignmentId =
        request.nextUrl.searchParams.get("assignmentId") ?? undefined

    const data = await getOrCreateTypingSession(session.user.id, assignmentId)

    return Response.json({ data }, { status: 200 })
}
