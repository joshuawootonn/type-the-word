import { and, eq } from "drizzle-orm"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import { getValidTeacherToken } from "~/server/classroom/teacher-token"
import {
    getStudent,
    getStudentSubmission,
    turnInSubmission,
} from "~/server/clients/classroom.client"
import { db } from "~/server/db"
import { accounts } from "~/server/db/schema"
import {
    getAssignment,
    getOrCreateSubmission,
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

    if (!session.user.email) {
        return NextResponse.json(
            { error: "Missing email on user account" },
            { status: 400 },
        )
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

        const tokenRecord = await getValidTeacherToken(assignment.teacherUserId)
        const accessToken = tokenRecord.accessToken

        const googleAccount = await db.query.accounts.findFirst({
            where: and(
                eq(accounts.userId, session.user.id),
                eq(accounts.provider, "google"),
            ),
        })
        const googleUserId = googleAccount?.providerAccountId

        if (!googleUserId) {
            return NextResponse.json(
                { error: "User not signed into a Google account" },
                { status: 400 },
            )
        }

        const student = await getStudent(
            accessToken,
            assignment.courseId,
            googleUserId,
        )

        if (!student) {
            return NextResponse.json(
                {
                    error: "Student not signed into a Google account in this Classroom",
                },
                { status: 400 },
            )
        }

        const classroomSubmission = await getStudentSubmission(
            accessToken,
            assignment.courseId,
            assignment.courseWorkId,
            student.userId,
        )

        if (!classroomSubmission) {
            return NextResponse.json(
                { error: "Submission not found" },
                { status: 404 },
            )
        }

        const submission = await getOrCreateSubmission({
            assignmentId: assignment.id,
            studentUserId: session.user.id,
            totalVerses: assignment.totalVerses,
            submissionId: classroomSubmission.id,
        })

        if (submission.isTurnedIn === 1) {
            return NextResponse.json({ success: true })
        }

        await turnInSubmission(
            accessToken,
            assignment.courseId,
            assignment.courseWorkId,
            classroomSubmission.id,
        )

        await markSubmissionTurnedIn(submission.id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error turning in assignment:", error)
        return NextResponse.json(
            { error: "Failed to turn in assignment" },
            { status: 500 },
        )
    }
}
