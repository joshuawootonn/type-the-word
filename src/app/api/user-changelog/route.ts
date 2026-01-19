import { getServerSession } from "next-auth"
import { NextRequest } from "next/server"

import { authOptions } from "~/server/auth"
import { db } from "~/server/db"
import { UserChangelogRepository } from "~/server/repositories/userChangelog.repository"

import { DTOToRecordSchema } from "./dto"

export const dynamic = "force-dynamic" // defaults to auto

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rawBody = await request.json()

    const body = DTOToRecordSchema.parse(rawBody)

    const userChangelogRepository = new UserChangelogRepository(db)
    const userChangelog = userChangelogRepository.updateLastVisitedChangelog({
        userId: session.user.id,
        lastVisitedAt: body.lastVisitedAt,
    })

    return Response.json({ data: userChangelog }, { status: 200 })
}

export async function GET() {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userChangelogRepository = new UserChangelogRepository(db)
    const userChangelog = await userChangelogRepository.getOneOrNull({
        userId: session.user.id,
    })

    if (userChangelog === null) {
        return Response.json({ data: null }, { status: 200 })
    }

    return Response.json({ data: userChangelog }, { status: 200 })
}
