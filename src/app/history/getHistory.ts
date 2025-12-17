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

export async function getOverviewData(
    userId: string,
    useOptimizedHistory: boolean,
): Promise<BookOverview[]> {
    if (useOptimizedHistory) {
        const userProgressRepository = new UserProgressRepository(db)
        const progressData = await userProgressRepository.getByUserId(userId)
        return getBookOverviewFromCache(progressData)
    } else {
        const typingSessionRepository = new TypingSessionRepository(db)
        const typingSessions = await typingSessionRepository.getMany({ userId })
        return getBookOverview(typingSessions)
    }
}

export async function getLogData(
    userId: string,
    timezoneOffset: number,
): Promise<MonthlyLogDTO[]> {
    const typingSessionRepository = new TypingSessionRepository(db)
    const typingSessions = await typingSessionRepository.getMany({ userId })
    return getLog2(typingSessions, timezoneOffset)
}

export async function getWpmData(
    userId: string,
    timezoneOffset: number,
): Promise<VerseStatsWithDate[]> {
    const typingSessionRepository = new TypingSessionRepository(db)
    const typingSessions = await typingSessionRepository.getMany({ userId })
    return getAllVerseStats(typingSessions, timezoneOffset)
}
