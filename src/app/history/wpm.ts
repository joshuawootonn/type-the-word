import {
    format,
    subDays,
    subMonths,
    subYears,
    startOfDay,
    startOfWeek,
    startOfMonth,
    eachDayOfInterval,
    eachWeekOfInterval,
    eachMonthOfInterval,
    isWithinInterval,
} from 'date-fns'

import { TypingData, typingDataSchema } from '~/server/db/schema'
import {
    TypedVerse,
    TypingSession,
} from '~/server/repositories/typingSession.repository'

export type TimeRange = 'week' | 'month' | '3months' | 'year'
export type Interval = 'daily' | 'weekly' | 'monthly'

export type AggregatedStats = {
    date: Date
    dateLabel: string
    averageWpm: number | null
    averageAccuracy: number | null
    versesWithData: number
}

export type VerseStatsWithDate = {
    wpm: number
    accuracy: number
    date: Date
}

export type VerseStats = {
    wpm: number
    accuracy: number
}

type UserAction = TypingData['userActions'][number]

const PAUSE_THRESHOLD_MS = 3000 // 3 seconds
const PAUSE_PENALTY_MS = 1000 // Only count 1 second of pause time

export function parseTypingData(data: unknown): TypingData | null {
    const result = typingDataSchema.safeParse(data)
    if (!result.success) {
        console.log(result.error)
        return null
    }
    return result.data
}

export function calculateAccuracy(typingData: TypingData): number {
    const correctLetters = typingData.correctNodes.flatMap(node => node.letters)
    const userLetters = typingData.userNodes.flatMap(node => node.letters)

    if (correctLetters.length === 0) {
        return 0
    }

    let correctCount = 0
    for (let i = 0; i < correctLetters.length; i++) {
        if (userLetters[i] === correctLetters[i]) {
            correctCount++
        }
    }

    return Math.round((correctCount / correctLetters.length) * 100)
}

/**
 * Calculate the effective duration, accounting for pauses.
 * If there's a gap of more than 3 seconds between actions,
 * only count 1 second of that gap as typing time.
 */
export function calculateEffectiveDuration(actions: UserAction[]): number {
    if (actions.length < 2) {
        return 0
    }

    let effectiveDurationMs = 0

    for (let i = 1; i < actions.length; i++) {
        const prevAction = actions[i - 1]
        const currAction = actions[i]

        if (!prevAction || !currAction) continue

        const prevTime = new Date(prevAction.datetime).getTime()
        const currTime = new Date(currAction.datetime).getTime()
        const gap = currTime - prevTime

        if (gap > PAUSE_THRESHOLD_MS) {
            // User paused - only count 1 second penalty
            effectiveDurationMs += PAUSE_PENALTY_MS
        } else {
            effectiveDurationMs += gap
        }
    }

    return effectiveDurationMs
}

/**
 * Get valid actions after filtering out those before the last deleteSoftLineBackward.
 * Returns null if there are fewer than 2 valid actions.
 */
export function getValidActionsAfterReset(
    actions: UserAction[],
): UserAction[] | null {
    // Find the last deleteSoftLineBackward action - this invalidates previous data
    const lastSoftLineBackwardIndex = actions.findLastIndex(
        action => action.type === 'deleteSoftLineBackward',
    )

    // Use only actions after the last deleteSoftLineBackward (or all actions if none)
    const validActions =
        lastSoftLineBackwardIndex >= 0
            ? actions.slice(lastSoftLineBackwardIndex + 1)
            : actions

    return validActions
}

export function calculateStatsForVerse(
    typedVerse: TypedVerse,
): VerseStats | null {
    const typingData = parseTypingData(typedVerse.typingData)
    if (!typingData) {
        return null
    }

    const validActions = getValidActionsAfterReset(typingData.userActions)
    if (validActions === null) {
        return null
    }

    if (validActions.length < 2) {
        return null
    }

    const durationMs = calculateEffectiveDuration(validActions)

    // If duration is less than 1 second, skip (likely invalid data)
    if (durationMs < 1000) {
        return null
    }

    const durationMinutes = durationMs / 1000 / 60

    // Count total letters typed from correctNodes
    const letterCount = typingData.correctNodes.reduce(
        (total, node) => total + node.letters.length,
        0,
    )

    if (letterCount === 0) {
        return null
    }

    // Standard WPM uses 5 characters per word
    const wordEquivalent = letterCount / 5
    const wpm = wordEquivalent / durationMinutes

    // Filter out unreasonably high WPM (likely errors in data)
    if (wpm > 300) {
        return null
    }

    const accuracy = calculateAccuracy(typingData)

    return {
        wpm: Math.round(wpm),
        accuracy,
    }
}

/**
 * Get all verse stats with their dates from the past year.
 * This data can be aggregated client-side based on selected time range and interval.
 */
export function getAllVerseStats(
    typingSessions: TypingSession[],
    clientTimezoneOffset: number,
): VerseStatsWithDate[] {
    const serverUTCOffset = new Date().getTimezoneOffset()

    const allStats: VerseStatsWithDate[] = []

    for (const session of typingSessions) {
        for (const typedVerse of session.typedVerses) {
            const hasTypingData = !!typedVerse.typingData

            if (!hasTypingData) {
                continue
            }

            // I have to use the session.createdAt, because for some reason the nested entity date is an "Invalid Date"
            const parsedCreatedAt = session.createdAt

            const clientTimezoneCreatedAt = new Date(
                parsedCreatedAt.getTime() +
                    (serverUTCOffset - clientTimezoneOffset) * 60 * 1000,
            )

            const stats = calculateStatsForVerse(typedVerse)

            if (stats === null) {
                continue
            }

            allStats.push({
                ...stats,
                date: clientTimezoneCreatedAt,
            })
        }
    }

    return allStats
}

function getTimeRangeInterval(timeRange: TimeRange): {
    start: Date
    end: Date
} {
    const now = new Date()
    switch (timeRange) {
        case 'week':
            return { start: startOfDay(subDays(now, 6)), end: now }
        case 'month':
            return { start: startOfDay(subMonths(now, 1)), end: now }
        case '3months':
            return { start: startOfDay(subMonths(now, 3)), end: now }
        case 'year':
            return { start: startOfDay(subYears(now, 1)), end: now }
    }
}

function getDateLabel(date: Date, interval: Interval): string {
    switch (interval) {
        case 'daily':
            return format(date, 'MMM d')
        case 'weekly':
            return format(date, 'MMM d')
        case 'monthly':
            return format(date, 'MMM yyyy')
    }
}

function getDateKey(date: Date, interval: Interval): string {
    switch (interval) {
        case 'daily':
            return format(date, 'yyyy-MM-dd')
        case 'weekly':
            return format(startOfWeek(date), 'yyyy-MM-dd')
        case 'monthly':
            return format(startOfMonth(date), 'yyyy-MM')
    }
}

function getIntervalDates(
    rangeInterval: { start: Date; end: Date },
    interval: Interval,
): Date[] {
    switch (interval) {
        case 'daily':
            return eachDayOfInterval(rangeInterval)
        case 'weekly':
            return eachWeekOfInterval(rangeInterval)
        case 'monthly':
            return eachMonthOfInterval(rangeInterval)
    }
}

/**
 * Aggregate verse stats by the given time range and interval.
 */
export function aggregateStats(
    allStats: VerseStatsWithDate[],
    timeRange: TimeRange,
    interval: Interval,
): AggregatedStats[] {
    const rangeInterval = getTimeRangeInterval(timeRange)

    // Filter stats to the selected time range
    const filteredStats = allStats.filter(stat =>
        isWithinInterval(stat.date, rangeInterval),
    )

    // Group stats by interval
    const statsByInterval: Record<string, VerseStats[]> = {}

    for (const stat of filteredStats) {
        const key = getDateKey(stat.date, interval)
        if (!statsByInterval[key]) {
            statsByInterval[key] = []
        }
        statsByInterval[key].push(stat)
    }

    // Generate all intervals in the range
    const intervalDates = getIntervalDates(rangeInterval, interval)

    // Calculate averages for each interval
    return intervalDates.map(date => {
        const key = getDateKey(date, interval)
        const intervalStats = statsByInterval[key] ?? []

        const averageWpm =
            intervalStats.length > 0
                ? Math.round(
                      intervalStats.reduce((a, b) => a + b.wpm, 0) /
                          intervalStats.length,
                  )
                : null

        const averageAccuracy =
            intervalStats.length > 0
                ? Math.round(
                      intervalStats.reduce((a, b) => a + b.accuracy, 0) /
                          intervalStats.length,
                  )
                : null

        return {
            date,
            dateLabel: getDateLabel(date, interval),
            averageWpm,
            averageAccuracy,
            versesWithData: intervalStats.length,
        }
    })
}
