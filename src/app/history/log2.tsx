import {
    TypedVerse,
    TypingSession,
} from '~/server/repositories/typingSession.repository'
import { typingSessionToString } from './typingSessionToString'
import { format, isAfter } from 'date-fns'
import { typedVerses } from '~/server/db/schema'

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
    month: Date
    numberOfVersesTyped: number
}

export function getLog2(typingSessions: TypingSession[]): MonthlyLogDTO[] {
    const monthLogs: Record<string, MonthlyLog> = {}
    for (const typingSession of typingSessions) {
        if (typingSession.typedVerses.length === 0) continue
        const monthString = format(typingSession.createdAt, 'yyyy-MM')
        const dayString = format(typingSession.createdAt, 'dd')
        const currentMonthLog = monthLogs[monthString]
        const currentDayLog = currentMonthLog?.days[dayString]
        if (currentMonthLog == null) {
            monthLogs[monthString] = {
                month: new Date(
                    typingSession.createdAt.getFullYear(),
                    typingSession.createdAt.getMonth(),
                ),
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
                typedVerses: typingSession.typedVerses,
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
                month: monthlyLog.month,
                days,
            }
        })
}
