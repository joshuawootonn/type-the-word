import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { stringToPassageObject } from '~/lib/passageObject'
import { passageSegmentSchema } from '~/lib/passageSegment'
import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import {
    TypedVerse,
    TypingSessionRepository,
} from '~/server/repositories/typingSession.repository'

export type ChapterHistory = {
    verses: Record<number, TypedVerse[]>
}

export const dynamic = 'force-dynamic'

export async function GET(
    _: NextRequest,
    { params }: { params: { passage?: string } },
) {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let passageObject

    try {
        passageObject = stringToPassageObject.parse(
            passageSegmentSchema.parse(params?.passage),
        )
    } catch (e) {
        return Response.json(
            {
                error: 'Invalid reference route segement',
            },
            { status: 400 },
        )
    }

    const typingSessionRepository = new TypingSessionRepository(db)

    const typingSessions = await typingSessionRepository.getMany({
        userId: session.user.id,
    })

    const verses: ChapterHistory['verses'] = {}

    for (const session of typingSessions) {
        for (const verse of session.typedVerses) {
            if (
                verse.book !== passageObject.book ||
                verse.chapter !== passageObject.chapter
            ) {
                continue
            }

            const acc = verses[verse.verse] ?? []
            verses[verse.verse] = [...acc, verse]
        }
    }

    return Response.json({ data: { verses } }, { status: 200 })
}
