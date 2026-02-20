import { sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

import { env } from "~/env.mjs"
import { db } from "~/server/db"
import { typedVerses, users } from "~/server/db/schema"

import {
    buildDiscordAnalyticsMessage,
    createClassroomTypedVerseWhere,
    createNewUsersWhere,
    createTypedVerseWhere,
    getPreviousDayWindowInTimeZone,
    isCronRequestAuthorized,
} from "./utils"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest): Promise<NextResponse> {
    if (env.CRON_SECRET == null) {
        return NextResponse.json(
            { error: "Missing CRON_SECRET" },
            { status: 500 },
        )
    }

    const authorizationHeader = request.headers.get("authorization")
    if (!isCronRequestAuthorized(authorizationHeader, env.CRON_SECRET)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (env.DISCORD_ANALYTICS_WEBHOOK_URL == null) {
        return NextResponse.json(
            { error: "Missing DISCORD_ANALYTICS_WEBHOOK_URL" },
            { status: 500 },
        )
    }

    const timeZone = env.ANALYTICS_TIMEZONE
    const window = getPreviousDayWindowInTimeZone(new Date(), timeZone)

    const [typedVerseResult, classroomTypedVerseResult, newUsersResult] =
        await Promise.all([
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(typedVerses)
                .where(createTypedVerseWhere(window)),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(typedVerses)
                .where(createClassroomTypedVerseWhere(window)),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(users)
                .where(createNewUsersWhere(window)),
        ])

    const typedVerseCount = typedVerseResult[0]?.count ?? 0
    const classroomTypedVerseCount = classroomTypedVerseResult[0]?.count ?? 0
    const newUsersCount = newUsersResult[0]?.count ?? 0

    const message = buildDiscordAnalyticsMessage({
        label: window.label,
        timeZone,
        typedVerses: typedVerseCount,
        classroomTypedVerses: classroomTypedVerseCount,
        newSignups: newUsersCount,
    })

    const discordResponse = await fetch(env.DISCORD_ANALYTICS_WEBHOOK_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: message }),
    })

    if (!discordResponse.ok) {
        const responseBody = await discordResponse.text()
        return NextResponse.json(
            {
                error: "Failed to post analytics to Discord",
                status: discordResponse.status,
                responseBody,
            },
            { status: 502 },
        )
    }

    return NextResponse.json({
        ok: true,
        date: window.label,
        timeZone,
        counts: {
            typedVerses: typedVerseCount,
            classroomTypedVerses: classroomTypedVerseCount,
            newSignups: newUsersCount,
        },
    })
}
