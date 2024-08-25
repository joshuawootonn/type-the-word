import { db } from '~/server/db'
import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'
import { BookOverview, getBookOverview } from './overview'
import { MonthlyLogDTO, getLog2 } from './log2'

export async function getHistory(userId: string): Promise<{
    overview: BookOverview[]
    log2: MonthlyLogDTO[]
}> {
    const typingSessionRepository = new TypingSessionRepository(db)

    const typingSessions = await typingSessionRepository.getMany({
        userId,
    })

    const overview = getBookOverview(typingSessions)

    const log2 = getLog2(typingSessions)

    return { overview, log2 }
}
