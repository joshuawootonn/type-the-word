import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import {
    refreshAccessToken,
    listStudents,
} from "~/server/clients/classroom.client"
import {
    getAssignment,
    getSubmissionsByAssignment,
    getTeacherToken,
    updateTeacherTokenAccess,
} from "~/server/repositories/classroom.repository"

import { type AssignmentDetail } from "../../schemas"

/**
 * Gets assignment details with student progress
 * GET /api/classroom/assignments/[id]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { id } = await params

        // Get assignment
        const assignment = await getAssignment(id)

        if (!assignment) {
            return NextResponse.json(
                { error: "Assignment not found" },
                { status: 404 },
            )
        }

        // Verify teacher owns this assignment
        if (assignment.teacherUserId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Get teacher's token
        const tokenRecord = await getTeacherToken(session.user.id)

        if (!tokenRecord) {
            return NextResponse.json(
                { error: "Google Classroom not connected" },
                { status: 403 },
            )
        }

        let accessToken = tokenRecord.accessToken

        // Refresh token if expired
        const now = new Date()
        if (tokenRecord.expiresAt <= now) {
            const refreshed = await refreshAccessToken(tokenRecord.refreshToken)
            accessToken = refreshed.accessToken

            await updateTeacherTokenAccess(
                session.user.id,
                refreshed.accessToken,
                refreshed.expiresAt,
            )
        }

        // Get students from Google Classroom
        const students = await listStudents(accessToken, assignment.courseId)

        // Get submissions from our database
        const submissions = await getSubmissionsByAssignment(id)
        const submissionMap = new Map(
            submissions.map(s => [s.studentUserId, s]),
        )

        // Combine student info with submission data
        const studentProgress = students.map(student => {
            const submission = submissionMap.get(student.userId)
            // Use assignment's totalVerses (always available) or submission's totalVerses (for backwards compat)
            const totalVerses =
                assignment.totalVerses || submission?.totalVerses || 0
            const completedVerses = submission?.completedVerses || 0

            return {
                studentName: student.profile?.name || null,
                studentEmail: student.profile?.emailAddress || "",
                completedVerses,
                totalVerses,
                completionPercentage:
                    totalVerses > 0
                        ? Math.round((completedVerses / totalVerses) * 100)
                        : 0,
                averageWpm: submission?.averageWpm || null,
                averageAccuracy: submission?.averageAccuracy || null,
                isCompleted: submission?.isCompleted === 1,
                startedAt: submission?.startedAt?.toISOString() || null,
                completedAt: submission?.completedAt?.toISOString() || null,
            }
        })

        const response: AssignmentDetail = {
            assignment: {
                ...assignment,
                dueDate: assignment.dueDate?.toISOString() || null,
                submissionCount: submissions.length,
                completedCount: submissions.filter(s => s.isCompleted === 1)
                    .length,
                averageCompletion: submissions.length
                    ? Math.round(
                          submissions.reduce(
                              (sum, s) =>
                                  sum +
                                  (s.completedVerses / s.totalVerses) * 100,
                              0,
                          ) / submissions.length,
                      )
                    : 0,
            },
            students: studentProgress,
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error("Error fetching assignment details:", error)
        return NextResponse.json(
            { error: "Failed to fetch assignment details" },
            { status: 500 },
        )
    }
}
