import { db } from '~/server/db'
import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'
import { UserDailyActivityRepository } from '~/server/repositories/userDailyActivity.repository'
import { UserProgressRepository } from '~/server/repositories/userProgress.repository'

import { MonthlyLogDTO, getLog2, getLogFromCache } from './log2'
import {
    BookOverview,
    getBookOverview,
    getBookOverviewFromCache,
} from './overview'
import { WpmChartData, getAllVerseStats, getDailyStatsFromCache } from './wpm'

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
    useOptimizedHistory: boolean,
): Promise<MonthlyLogDTO[]> {
    if (useOptimizedHistory) {
        const dailyActivityRepository = new UserDailyActivityRepository(db)
        const dailyActivity = await dailyActivityRepository.getByUserId(userId)
        return getLogFromCache(dailyActivity, timezoneOffset)
    } else {
        const typingSessionRepository = new TypingSessionRepository(db)
        const typingSessions = await typingSessionRepository.getMany({ userId })
        return getLog2(typingSessions, timezoneOffset)
    }
}

export async function getWpmData(
    userId: string,
    timezoneOffset: number,
    useOptimizedHistory: boolean,
): Promise<WpmChartData> {
    if (useOptimizedHistory) {
        const dailyActivityRepository = new UserDailyActivityRepository(db)
        const dailyActivity = await dailyActivityRepository.getByUserId(userId)
        return {
            type: 'cached',
            data: getDailyStatsFromCache(dailyActivity, timezoneOffset),
        }
    } else {
        const typingSessionRepository = new TypingSessionRepository(db)
        const typingSessions = await typingSessionRepository.getMany({ userId })
        return {
            type: 'raw',
            data: getAllVerseStats(typingSessions, timezoneOffset),
        }
    }
}
