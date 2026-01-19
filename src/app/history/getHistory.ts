import { db } from "~/server/db"
import { Translation } from "~/server/db/schema"
import { UserDailyActivityRepository } from "~/server/repositories/userDailyActivity.repository"
import { UserProgressRepository } from "~/server/repositories/userProgress.repository"

import { MonthlyLogDTO, getLogFromCache } from "./log2"
import { BookOverview, getBookOverviewFromCache } from "./overview"
import { WpmChartData, getDailyStatsFromCache } from "./wpm"

export async function getOverviewData(
    userId: string,
    translation: Translation,
): Promise<BookOverview[]> {
    const userProgressRepository = new UserProgressRepository(db)
    const progressData = await userProgressRepository.getByUserId(
        userId,
        translation,
    )
    return getBookOverviewFromCache(progressData)
}

export async function getLogData(
    userId: string,
    timezoneOffset: number,
): Promise<MonthlyLogDTO[]> {
    const dailyActivityRepository = new UserDailyActivityRepository(db)
    const dailyActivity = await dailyActivityRepository.getByUserId(userId)
    return getLogFromCache(dailyActivity, timezoneOffset)
}

export async function getWpmData(
    userId: string,
    timezoneOffset: number,
): Promise<WpmChartData> {
    const dailyActivityRepository = new UserDailyActivityRepository(db)
    const dailyActivity = await dailyActivityRepository.getByUserId(userId)
    return {
        type: "cached",
        data: getDailyStatsFromCache(dailyActivity, timezoneOffset),
    }
}
