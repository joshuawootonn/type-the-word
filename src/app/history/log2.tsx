import { format, startOfMonth } from 'date-fns'

import {
    TypedVerse,
    TypingSession,
} from '~/server/repositories/typingSession.repository'

import { typingSessionToString } from './typingSessionToString'

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
        const monthString = format(clientTimezoneCreatedAt, 'yyyy-MM')
        const dayString = format(clientTimezoneCreatedAt, 'dd')
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
                            seperator: '\n',
                        }).split('\n'),
                        createdAt: day.createdAt,
                    },
                }),
                {} as MonthlyLogDTO['days'],
            )

            return {
                numberOfVersesTyped: monthlyLog.numberOfVersesTyped,
                month: monthlyLog.month.getMonth(),
                year: monthlyLog.month.getFullYear(),
                days,
            }
        })
}
