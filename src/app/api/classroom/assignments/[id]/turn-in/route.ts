import { and, eq } from "drizzle-orm"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { calculateStatsForVerse } from "~/app/history/wpm"
import { env } from "~/env.mjs"
import { authOptions } from "~/server/auth"
import { getValidStudentToken } from "~/server/classroom/student-token"
import { getValidTeacherToken } from "~/server/classroom/teacher-token"
import {
    addSubmissionLinkAttachment,
    getStudent,
    getStudentSubmission,
    updateDraftGrade,
    turnInSubmission,
} from "~/server/clients/classroom.client"
import { db } from "~/server/db"
import { typedVerses } from "~/server/db/schema"
import {
    getAssignment,
    getOrCreateSubmission,
    getSubmissionByStudent,
    updateSubmissionProgress,
    markSubmissionTurnedIn,
} from "~/server/repositories/classroom.repository"

/**
 * Turns in a student assignment submission
 * POST /api/classroom/assignments/[id]/turn-in
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { id } = await params
        const assignment = await getAssignment(id)

        if (!assignment) {
            return NextResponse.json(
                { error: "Assignment not found" },
                { status: 404 },
            )
        }

        const teacherToken = await getValidTeacherToken(
            assignment.teacherUserId,
        )
        const teacherAccessToken = teacherToken.accessToken
        const { accessToken: studentAccessToken, googleUserId } =
            await getValidStudentToken(session.user.id)

        const student = await getStudent(
            teacherAccessToken,
            assignment.courseId,
            googleUserId,
        )

        if (!student) {
            return NextResponse.json(
                {
                    error: "Student is not enrolled in this Classroom",
                },
                { status: 403 },
            )
        }

        let submissionRecord = await getSubmissionByStudent(
            assignment.id,
            session.user.id,
        )
        let submissionId = submissionRecord?.submissionId ?? null

        if (!submissionId) {
            const classroomSubmission = await getStudentSubmission(
                teacherAccessToken,
                assignment.courseId,
                assignment.courseWorkId,
                googleUserId,
            )

            if (!classroomSubmission) {
                return NextResponse.json(
                    { error: "Submission not found" },
                    { status: 404 },
                )
            }

            submissionRecord = await getOrCreateSubmission({
                assignmentId: assignment.id,
                studentUserId: session.user.id,
                totalVerses: assignment.totalVerses,
                submissionId: classroomSubmission.id,
            })
            submissionId = submissionRecord.submissionId ?? null
        }

        if (!submissionId) {
            return NextResponse.json(
                { error: "Submission not found" },
                { status: 404 },
            )
        }

        if (submissionRecord?.isTurnedIn === 1) {
            return NextResponse.json({ success: true })
        }

        const verseRows = await db.query.typedVerses.findMany({
            where: and(
                eq(typedVerses.userId, session.user.id),
                eq(typedVerses.classroomAssignmentId, assignment.id),
            ),
        })
        const latestVerseMap = new Map<string, (typeof verseRows)[number]>()
        verseRows.forEach(row => {
            const key = `${row.chapter}:${row.verse}`
            const existing = latestVerseMap.get(key)
            if (!existing || row.createdAt > existing.createdAt) {
                latestVerseMap.set(key, row)
            }
        })

        const completedVerses = latestVerseMap.size
        const completionPercentage =
            assignment.totalVerses > 0
                ? completedVerses / assignment.totalVerses
                : 0
        const draftGrade = Math.round(
            assignment.maxPoints * completionPercentage,
        )
        const stats = Array.from(latestVerseMap.values())
            .map(row => calculateStatsForVerse(row))
            .filter(
                (value): value is NonNullable<typeof value> => value != null,
            )
        const averageWpm =
            stats.length > 0
                ? Math.round(
                      stats.reduce((sum, stat) => sum + stat.wpm, 0) /
                          stats.length,
                  )
                : undefined
        const averageAccuracy =
            stats.length > 0
                ? Math.round(
                      stats.reduce((sum, stat) => sum + stat.accuracy, 0) /
                          stats.length,
                  )
                : undefined

        if (submissionRecord) {
            await updateSubmissionProgress(submissionRecord.id, {
                completedVerses,
                averageWpm,
                averageAccuracy,
                isCompleted: completedVerses >= assignment.totalVerses,
                grade: draftGrade,
            })
        }

        await updateDraftGrade(
            teacherAccessToken,
            assignment.courseId,
            assignment.courseWorkId,
            submissionId,
            draftGrade,
        )

        if (averageWpm != null && averageAccuracy != null) {
            await addSubmissionLinkAttachment(
                studentAccessToken,
                assignment.courseId,
                assignment.courseWorkId,
                submissionId,
                {
                    url: `${env.DEPLOYED_URL}/classroom/${assignment.courseId}/assignment/${assignment.id}`,
                },
            )
        }

        await turnInSubmission(
            studentAccessToken,
            assignment.courseId,
            assignment.courseWorkId,
            submissionId,
        )

        if (submissionRecord) {
            await markSubmissionTurnedIn(submissionRecord.id)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error turning in assignment:", error)
        return NextResponse.json(
            { error: "Failed to turn in assignment" },
            { status: 500 },
        )
    }
}
