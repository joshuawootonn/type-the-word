import { differenceInMinutes, subMinutes } from 'date-fns'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import { typingSessions } from '~/server/db/schema'
import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'

export const dynamic = 'force-dynamic' // defaults to auto

export async function GET(_: NextRequest) {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const typingSessionRepository = new TypingSessionRepository(db)

    const lastTypingSession = await typingSessionRepository.getOneOrNull({
        userId: session.user.id,
    })

    if (
        lastTypingSession &&
        differenceInMinutes(
            subMinutes(new Date(), 15),
            lastTypingSession?.updatedAt,
        ) < 15
    ) {
        return Response.json({ data: lastTypingSession }, { status: 200 })
    }

    const [nextSession] = await db
        .insert(typingSessions)
        .values({ userId: session.user.id })
        .returning()

    if (!nextSession) {
        return Response.json(
            { error: 'Failed to create new typing session' },
            { status: 500 },
        )
    }

    const newTypingSession = await typingSessionRepository.getOne({
        id: nextSession.id,
    })

    return Response.json({ data: newTypingSession }, { status: 200 })
}
