import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import { getValidTeacherToken } from "~/server/classroom/teacher-token"
import { listCourses } from "~/server/clients/classroom.client"
import {
    approveTeacherMembership,
    getApprovedOrganizationForUser,
    isUserOrganizationAdmin,
    syncTeacherCourseMappings,
} from "~/server/repositories/organization.repository"

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ userId: string }> },
) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organization = await getApprovedOrganizationForUser(session.user.id)
    if (!organization) {
        return NextResponse.json(
            { error: "No approved organization membership" },
            { status: 403 },
        )
    }

    const isOrgAdmin = await isUserOrganizationAdmin({
        organizationId: organization.id,
        userId: session.user.id,
    })
    if (!isOrgAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params

    try {
        await approveTeacherMembership({
            organizationId: organization.id,
            teacherUserId: userId,
            approvedByUserId: session.user.id,
        })

        // Best effort: once approved, sync their course mappings immediately.
        try {
            const teacherToken = await getValidTeacherToken(userId)
            const courses = await listCourses(teacherToken.accessToken)
            await syncTeacherCourseMappings({
                organizationId: organization.id,
                teacherUserId: userId,
                courseIds: courses.map(course => course.id),
            })
        } catch {
            // Teacher can reconnect if token/courses are temporarily unavailable.
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to approve",
            },
            { status: 400 },
        )
    }
}
