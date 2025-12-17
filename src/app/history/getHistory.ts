import { db } from '~/server/db'
import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'
import { UserProgressRepository } from '~/server/repositories/userProgress.repository'

import { MonthlyLogDTO, getLog2 } from './log2'
import {
    BookOverview,
    getBookOverview,
    getBookOverviewFromCache,
} from './overview'
import { VerseStatsWithDate, getAllVerseStats } from './wpm'

export async function getHistory(
    userId: string,
    timezoneOffset: number,
    useOptimizedHistory = false,
): Promise<{
    overview: BookOverview[]
    log2: MonthlyLogDTO[]
    allVerseStats: VerseStatsWithDate[]
}> {
    const typingSessionRepository = new TypingSessionRepository(db)

    // Fetch typing sessions (still needed for log2 and wpm stats)
    const typingSessions = await typingSessionRepository.getMany({
        userId,
    })

    // Use cached data for overview when flag is enabled
    let overview: BookOverview[]
    if (useOptimizedHistory) {
        const userProgressRepository = new UserProgressRepository(db)
        const progressData = await userProgressRepository.getByUserId(userId)
        overview = getBookOverviewFromCache(progressData)
    } else {
        overview = getBookOverview(typingSessions)
    }

    const log2 = getLog2(typingSessions, timezoneOffset)

    const allVerseStats = getAllVerseStats(typingSessions, timezoneOffset)

    return { overview, log2, allVerseStats }
}
