import { differenceInMinutes, subMinutes } from "date-fns"

import { db } from "~/server/db"
import { typingSessions } from "~/server/db/schema"
import {
    TypingSession,
    TypingSessionRepository,
} from "~/server/repositories/typingSession.repository"

export async function getOrCreateTypingSession(
    userId: string,
    assignmentId?: string,
): Promise<TypingSession> {
    const typingSessionRepository = new TypingSessionRepository(db)

    const lastTypingSession = await typingSessionRepository.getOneOrNull({
        userId,
    })

    if (
        lastTypingSession &&
        differenceInMinutes(
            subMinutes(new Date(), 15),
            lastTypingSession?.updatedAt,
        ) < 15
    ) {
        return {
            ...lastTypingSession,
            typedVerses: lastTypingSession.typedVerses.filter(
                verse =>
                    assignmentId == null ||
                    verse.classroomAssignmentId === assignmentId,
            ),
        }
    }

    const [nextSession] = await db
        .insert(typingSessions)
        .values({ userId })
        .returning()

    if (!nextSession) {
        throw new Error("Failed to create new typing session")
    }

    const newTypingSession = await typingSessionRepository.getOne({
        id: nextSession.id,
    })
    return newTypingSession
}
