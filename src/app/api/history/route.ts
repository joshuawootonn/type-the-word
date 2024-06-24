import { getServerSession } from 'next-auth'
import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import {
    TypedVerse,
    TypingSessionRepository,
} from '~/server/repositories/typingSession.repository'
import { getTypingSessionLog } from './log'
import { getBookOverview } from './overview'

export type ChapterHistory = {
    verses: Record<number, TypedVerse[]>
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const typingSessionRepository = new TypingSessionRepository(db)

    const typingSessions = await typingSessionRepository.getMany({
        userId: session.user.id,
    })

    const overview = getBookOverview(typingSessions)

    const log = typingSessions
        .map(a => getTypingSessionLog(a))
        .filter(a => a.numberOfVersesTyped > 0)

    return Response.json({ data: { overview, log } }, { status: 200 })
}
