import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import {
    getAssignment,
    getTeacherToken,
    updateAssignmentFromClassroomSync,
    updateTeacherTokenAccess,
} from "~/server/classroom/classroom.repository"
import { canTeacherAccessAssignment } from "~/server/classroom/organization-access"
import {
    getCourseWork,
    refreshAccessToken,
} from "~/server/clients/classroom.client"

/**
 * Manually syncs assignment metadata from Google Classroom
 * POST /api/classroom/assignments/[id]/sync
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

        const canAccess = await canTeacherAccessAssignment({
            userId: session.user.id,
            assignment: {
                organizationId: assignment.organizationId,
                courseId: assignment.courseId,
                teacherUserId: assignment.teacherUserId,
            },
        })
        if (!canAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const tokenRecord = await getTeacherToken(session.user.id)
        if (!tokenRecord) {
            return NextResponse.json(
                { error: "Google Classroom not connected" },
                { status: 403 },
            )
        }

        let accessToken = tokenRecord.accessToken
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

        const courseWork = await getCourseWork(
            accessToken,
            assignment.courseId,
            assignment.courseWorkId,
        )

        let dueDate: Date | null = null
        if (courseWork.dueDate) {
            const hours = courseWork.dueTime?.hours ?? 23
            const minutes = courseWork.dueTime?.minutes ?? 59
            dueDate = new Date(
                courseWork.dueDate.year,
                courseWork.dueDate.month - 1,
                courseWork.dueDate.day,
                hours,
                minutes,
            )
        }

        const state =
            courseWork.state === "DRAFT" ||
            courseWork.state === "PUBLISHED" ||
            courseWork.state === "DELETED"
                ? courseWork.state
                : assignment.state

        await updateAssignmentFromClassroomSync({
            assignmentId: assignment.id,
            title: courseWork.title ?? assignment.title,
            description: courseWork.description ?? assignment.description,
            dueDate: dueDate ?? assignment.dueDate,
            state,
            lastSyncedAt: now,
        })

        return NextResponse.json({
            success: true,
            classroomLink: courseWork.alternateLink,
        })
    } catch (error) {
        console.error("Error syncing assignment:", error)
        return NextResponse.json(
            { error: "Failed to sync assignment" },
            { status: 500 },
        )
    }
}
