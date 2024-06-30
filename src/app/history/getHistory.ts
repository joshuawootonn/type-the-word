import { db } from '~/server/db'
import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'
import { TypingSessionLog, getTypingSessionLog } from './log'
import { BookOverview, getBookOverview } from './overview'

export async function getHistory(
    userId: string,
): Promise<{ log: TypingSessionLog[]; overview: BookOverview[] }> {
    const typingSessionRepository = new TypingSessionRepository(db)

    const typingSessions = await typingSessionRepository.getMany({
        userId,
    })

    const overview = getBookOverview(typingSessions)

    const log = typingSessions
        .map(a => getTypingSessionLog(a))
        .filter(a => a.numberOfVersesTyped > 0)
    return { overview, log }
}
