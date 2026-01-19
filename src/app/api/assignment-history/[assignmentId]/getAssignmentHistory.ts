import { and, eq, gte, isNotNull } from "drizzle-orm"

import { db } from "~/server/db"
import { typedVerses } from "~/server/db/schema"
import { getAssignment } from "~/server/repositories/classroom.repository"

export type AssignmentHistory = {
    verses: Record<number, boolean>
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
        .select({
            verse: typedVerses.verse,
        })
        .from(typedVerses)
        .where(
            and(
                eq(typedVerses.userId, userId),
                eq(typedVerses.classroomAssignmentId, assignmentId),
                isNotNull(typedVerses.classroomAssignmentId),
                gte(typedVerses.createdAt, assignment.createdAt),
            ),
        )

    const verses: Record<number, boolean> = {}
    verseRows.forEach(row => {
        verses[row.verse] = true
    })
    const data: AssignmentHistory = {
        verses,
        chapterLogs: [],
    }

    return data
}
