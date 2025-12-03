import { db } from '~/server/db'
import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'
import { BookOverview, getBookOverview } from './overview'
import { MonthlyLogDTO, getLog2 } from './log2'
import { VerseStatsWithDate, getAllVerseStats } from './wpm'

export async function getHistory(
    userId: string,
    timezoneOffset: number,
): Promise<{
    overview: BookOverview[]
    log2: MonthlyLogDTO[]
    allVerseStats: VerseStatsWithDate[]
}> {
    const typingSessionRepository = new TypingSessionRepository(db)

    const typingSessions = await typingSessionRepository.getMany({
        userId,
    })

    const overview = getBookOverview(typingSessions)

    const log2 = getLog2(typingSessions, timezoneOffset)

    const allVerseStats = getAllVerseStats(typingSessions, timezoneOffset)

    return { overview, log2, allVerseStats }
}
