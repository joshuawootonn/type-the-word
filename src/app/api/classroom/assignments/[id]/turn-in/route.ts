import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import { getValidStudentToken } from "~/server/classroom/student-token"
import { getValidTeacherToken } from "~/server/classroom/teacher-token"
import {
    getStudent,
    getStudentSubmission,
    turnInSubmission,
} from "~/server/clients/classroom.client"
import {
    getAssignment,
    getOrCreateSubmission,
    getSubmissionByStudent,
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
