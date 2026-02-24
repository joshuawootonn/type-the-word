import { and, gte, isNotNull, lt, SQL } from "drizzle-orm"
import { PgDialect } from "drizzle-orm/pg-core"

import { typedVerses, users } from "~/server/db/schema"

export type DateWindow = {
    start: Date
    end: Date
    label: string
}

type DateParts = {
    year: number
    month: number
    day: number
}

function getDatePartsInTimeZone(date: Date, timeZone: string): DateParts {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date)

    const year = Number(parts.find(part => part.type === "year")?.value)
    const month = Number(parts.find(part => part.type === "month")?.value)
    const day = Number(parts.find(part => part.type === "day")?.value)

    return { year, month, day }
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(date)

    const year = Number(parts.find(part => part.type === "year")?.value)
    const month = Number(parts.find(part => part.type === "month")?.value)
    const day = Number(parts.find(part => part.type === "day")?.value)
    const rawHour = Number(parts.find(part => part.type === "hour")?.value)
    // Some ICU/runtime combinations represent midnight as 24:00.
    const hour = rawHour === 24 ? 0 : rawHour
    const minute = Number(parts.find(part => part.type === "minute")?.value)
    const second = Number(parts.find(part => part.type === "second")?.value)

    const asUtcTimestamp = Date.UTC(year, month - 1, day, hour, minute, second)
    return asUtcTimestamp - date.getTime()
}

function getUtcForMidnightInTimeZone(
    dateParts: DateParts,
    timeZone: string,
): Date {
    const utcGuess = Date.UTC(
        dateParts.year,
        dateParts.month - 1,
        dateParts.day,
        0,
        0,
        0,
    )
    const firstOffset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone)
    let resolved = utcGuess - firstOffset

    // Re-check offset using the resolved instant for DST-boundary correctness.
    const secondOffset = getTimeZoneOffsetMs(new Date(resolved), timeZone)
    if (secondOffset !== firstOffset) {
        resolved = utcGuess - secondOffset
    }

    return new Date(resolved)
}

export function getPreviousDayWindowInTimeZone(
    now: Date,
    timeZone: string,
): DateWindow {
    const todayParts = getDatePartsInTimeZone(now, timeZone)
    const todayUtcDate = new Date(
        Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day),
    )
    todayUtcDate.setUTCDate(todayUtcDate.getUTCDate() - 1)

    const previousDayParts: DateParts = {
        year: todayUtcDate.getUTCFullYear(),
        month: todayUtcDate.getUTCMonth() + 1,
        day: todayUtcDate.getUTCDate(),
    }

    const start = getUtcForMidnightInTimeZone(previousDayParts, timeZone)
    const end = getUtcForMidnightInTimeZone(todayParts, timeZone)
    const label = `${previousDayParts.year}-${String(
        previousDayParts.month,
    ).padStart(2, "0")}-${String(previousDayParts.day).padStart(2, "0")}`

    return { start, end, label }
}

export function isCronRequestAuthorized(
    authorizationHeader: string | null,
    cronSecret: string | undefined,
): boolean {
    if (cronSecret == null) {
        return false
    }

    return authorizationHeader === `Bearer ${cronSecret}`
}

export function createTypedVerseWhere(window: DateWindow): SQL {
    const where = and(
        gte(typedVerses.createdAt, window.start),
        lt(typedVerses.createdAt, window.end),
    )
    if (where == null) {
        throw new Error("Could not build typed verse where clause")
    }

    return where
}

export function createClassroomTypedVerseWhere(window: DateWindow): SQL {
    const where = and(
        createTypedVerseWhere(window),
        isNotNull(typedVerses.classroomAssignmentId),
    )
    if (where == null) {
        throw new Error("Could not build classroom typed verse where clause")
    }

    return where
}

export function createNewUsersWhere(window: DateWindow): SQL {
    const where = and(
        gte(users.createdAt, window.start),
        lt(users.createdAt, window.end),
    )
    if (where == null) {
        throw new Error("Could not build new users where clause")
    }

    return where
}

export function buildDiscordAnalyticsMessage(input: {
    label: string
    timeZone: string
    typedVerses: number
    classroomTypedVerses: number
    newSignups: number
}): string {
    return [
        `Daily Analytics (${input.label}, ${input.timeZone})`,
        `- Verses typed: **${input.typedVerses}**`,
        `- Classroom verses typed: **${input.classroomTypedVerses}**`,
        `- New signups: **${input.newSignups}**`,
    ].join("\n")
}

export function toSqlString(sqlFragment: SQL): string {
    const dialect = new PgDialect()
    return dialect.sqlToQuery(sqlFragment).sql
}
