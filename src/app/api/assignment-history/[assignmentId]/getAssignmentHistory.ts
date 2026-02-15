import { and, eq, gte, isNotNull, SQL } from "drizzle-orm"

import { calculateStatsForVerse } from "~/app/(app)/history/wpm"
import { db } from "~/server/db"
import { typedVerses } from "~/server/db/schema"
import { getAssignment } from "~/server/repositories/classroom.repository"

import { getLatestVerseByChapter } from "./verse-location"

export type VerseStats = {
    wpm: number | null
    accuracy: number | null
}

export type AssignmentHistory = {
    verses: Record<string, VerseStats>
    chapterLogs: []
}

export async function getAssignmentHistory(
    userId: string,
    assignmentId: string,
    options?: { chapter?: number },
): Promise<AssignmentHistory> {
    const assignment = await getAssignment(assignmentId)

    if (assignment == null) {
        throw new Error("Assignment not found")
    }

    const conditions: SQL[] = [
        eq(typedVerses.userId, userId),
        eq(typedVerses.classroomAssignmentId, assignmentId),
        isNotNull(typedVerses.classroomAssignmentId),
        gte(typedVerses.createdAt, assignment.createdAt),
    ]
    if (options?.chapter != null) {
        conditions.push(eq(typedVerses.chapter, options.chapter))
    }

    const verseRows = await db
        .select()
        .from(typedVerses)
        .where(and(...conditions))

    const latestVersesByLocation = getLatestVerseByChapter(verseRows, {
        chapterOnly: options?.chapter != null,
    })

    const verses: Record<string, VerseStats> = {}
    latestVersesByLocation.forEach((row, key) => {
        const stats = calculateStatsForVerse(row)
        verses[key] = {
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
