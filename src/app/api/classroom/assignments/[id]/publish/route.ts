import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import {
    refreshAccessToken,
    updateCourseWorkState,
} from "~/server/clients/classroom.client"
import {
    getAssignment,
    getTeacherToken,
    updateAssignmentState,
    updateTeacherTokenAccess,
} from "~/server/repositories/classroom.repository"

/**
 * Publishes a draft assignment
 * POST /api/classroom/assignments/[id]/publish
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

        // Update state in Google Classroom
        await updateCourseWorkState(
            accessToken,
            assignment.courseId,
            assignment.courseWorkId,
            "PUBLISHED",
        )

        // Update state in our database
        await updateAssignmentState(id, "PUBLISHED")

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error publishing assignment:", error)
        return NextResponse.json(
            { error: "Failed to publish assignment" },
            { status: 500 },
        )
    }
}
