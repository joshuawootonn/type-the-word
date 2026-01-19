import { format, startOfMonth } from "date-fns"

import {
    TypedVerse,
    TypingSession,
} from "~/server/repositories/typingSession.repository"
import { DailyActivityRow } from "~/server/repositories/userDailyActivity.repository"

import { typingSessionToString } from "./typingSessionToString"

type DayLog = {
    typedVerses: TypedVerse[]
    numberOfVersesTyped: number
    createdAt: Date
}

type MonthlyLog = {
    days: Record<string, DayLog>
    month: Date
    numberOfVersesTyped: number
}

type DayLogDTO = {
    numberOfVersesTyped: number
    location: string[]
    createdAt: Date
}

export type MonthlyLogDTO = {
    days: Record<string, DayLogDTO>
    // todo(josh): when I have more time I should switch this to be a date and figure out how UTC works
    // I made it two numbers because I was passing the beginning of the month as the data for which month this is
    // but with the server being in a different time zone things were getting off by a month
    month: number
    year: number
    numberOfVersesTyped: number
}

/**
 * Convert cached daily activity rows to MonthlyLogDTO format
 * This is the optimized path that reads from the cache table
 *
 * Note: The dates in userDailyActivity are stored as "calendar dates" at UTC midnight,
 * representing the day the activity occurred. We use UTC methods to extract the day/month/year
 * to avoid local timezone shifting the date by a day.
 */
export function getLogFromCache(
    dailyActivity: DailyActivityRow[],
    _clientTimezoneOffset: number,
): MonthlyLogDTO[] {
    const monthLogs: Record<
        string,
        {
            month: Date
            numberOfVersesTyped: number
            days: Record<string, DayLogDTO>
        }
    > = {}

    for (const row of dailyActivity) {
        // The date is stored at UTC midnight representing a calendar day
        // Use UTC methods to extract the correct day without timezone shifting
        const year = row.date.getUTCFullYear()
        const month = row.date.getUTCMonth()
        const day = row.date.getUTCDate()

        // Create a local date from the UTC components for formatting
        const dateForFormatting = new Date(year, month, day)
        const monthString = format(dateForFormatting, "yyyy-MM")
        const dayString = format(dateForFormatting, "dd")

        const currentMonthLog = monthLogs[monthString]

        if (currentMonthLog == null) {
            // Create a UTC date for the first of the month
            const monthDate = new Date(Date.UTC(year, month, 1))
            monthLogs[monthString] = {
                month: monthDate,
                numberOfVersesTyped: row.verseCount,
                days: {
                    [dayString]: {
                        numberOfVersesTyped: row.verseCount,
                        location: row.passages,
                        createdAt: row.date,
                    },
                },
            }
        } else {
            currentMonthLog.numberOfVersesTyped += row.verseCount
            currentMonthLog.days[dayString] = {
                numberOfVersesTyped: row.verseCount,
                location: row.passages,
                createdAt: row.date,
            }
        }
    }

    return Object.entries(monthLogs)
        .sort((a, b) => (a[0] > b[0] ? -1 : 1))
        .map(
            ([_, monthlyLog]): MonthlyLogDTO => ({
                numberOfVersesTyped: monthlyLog.numberOfVersesTyped,
                month: monthlyLog.month.getUTCMonth(),
                year: monthlyLog.month.getUTCFullYear(),
                days: monthlyLog.days,
            }),
        )
}

export function getLog2(
    typingSessions: TypingSession[],
    clientTimezoneOffset: number,
): MonthlyLogDTO[] {
    const monthLogs: Record<string, MonthlyLog> = {}

    for (const typingSession of typingSessions) {
        if (typingSession.typedVerses.length === 0) continue
        const serverUTCOffset = new Date().getTimezoneOffset()

        const clientTimezoneCreatedAt = new Date(
            typingSession.createdAt.getTime() +
                (serverUTCOffset - clientTimezoneOffset) * 60 * 1000,
        )
        const monthString = format(clientTimezoneCreatedAt, "yyyy-MM")
        const dayString = format(clientTimezoneCreatedAt, "dd")
        const currentMonthLog = monthLogs[monthString]
        const currentDayLog = currentMonthLog?.days[dayString]

        if (currentMonthLog == null) {
            monthLogs[monthString] = {
                month: startOfMonth(clientTimezoneCreatedAt),
                numberOfVersesTyped: typingSession.typedVerses.length,
                days: {
                    [dayString]: {
                        typedVerses: typingSession.typedVerses,
                        numberOfVersesTyped: typingSession.typedVerses.length,
                        createdAt: typingSession.createdAt,
                    },
                },
            }
        } else if (currentDayLog == null) {
            currentMonthLog.numberOfVersesTyped +=
                typingSession.typedVerses.length
            currentMonthLog.days[dayString] = {
                typedVerses: typingSession.typedVerses,
                numberOfVersesTyped: typingSession.typedVerses.length,
                createdAt: typingSession.createdAt,
            }
        } else {
            currentMonthLog.numberOfVersesTyped +=
                typingSession.typedVerses.length
            currentMonthLog.days[dayString] = {
                typedVerses: [
                    ...(currentMonthLog.days[dayString]?.typedVerses ?? []),
                    ...typingSession.typedVerses,
                ],
                numberOfVersesTyped:
                    currentDayLog.numberOfVersesTyped +
                    typingSession.typedVerses.length,
                createdAt: typingSession.createdAt,
            }
        }
    }

    return Object.entries(monthLogs)
        .sort((a, b) => (a[0] > b[0] ? -1 : 1))
        .map(([_, monthlyLog]): MonthlyLogDTO => {
            const days = Object.entries(monthlyLog.days).reduce(
                (acc, [key, day]) => ({
                    ...acc,
                    [key]: {
                        numberOfVersesTyped: day.numberOfVersesTyped,
                        location: typingSessionToString(day.typedVerses, {
                            seperator: "\n",
                        }).split("\n"),
                        createdAt: day.createdAt,
                    },
                }),
                {} as MonthlyLogDTO["days"],
            )

            return {
                numberOfVersesTyped: monthlyLog.numberOfVersesTyped,
                month: monthlyLog.month.getMonth(),
                year: monthlyLog.month.getFullYear(),
                days,
            }
        })
}
