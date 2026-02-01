import { and, eq, gte, isNotNull } from "drizzle-orm"

import { calculateStatsForVerse } from "~/app/history/wpm"
import { db } from "~/server/db"
import { typedVerses } from "~/server/db/schema"
import { getAssignment } from "~/server/repositories/classroom.repository"

export type VerseStats = {
    wpm: number | null
    accuracy: number | null
}

export type AssignmentHistory = {
    verses: Record<number, VerseStats>
    chapterLogs: []
}

export async function getAssignmentHistory(
    userId: string,
    assignmentId: string,
): Promise<AssignmentHistory> {
    const assignment = await getAssignment(assignmentId)

    if (assignment == null) {
        throw new Error("Assignment not found")
    }

    const verseRows = await db
        .select()
        .from(typedVerses)
        .where(
            and(
                eq(typedVerses.userId, userId),
                eq(typedVerses.classroomAssignmentId, assignmentId),
                isNotNull(typedVerses.classroomAssignmentId),
                gte(typedVerses.createdAt, assignment.createdAt),
            ),
        )

    const verses: Record<number, VerseStats> = {}
    verseRows.forEach(row => {
        const stats = calculateStatsForVerse(row)
        verses[row.verse] = {
            wpm: stats?.wpm ?? null,
            accuracy: stats?.accuracy ?? null,
        }
    })
    const data: AssignmentHistory = {
        verses,
        chapterLogs: [],
    }

    return data
}
