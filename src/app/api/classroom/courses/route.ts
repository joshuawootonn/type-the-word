import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import {
    listCourses,
    refreshAccessToken,
} from "~/server/clients/classroom.client"
import {
    getTeacherToken,
    updateTeacherTokenAccess,
} from "~/server/repositories/classroom.repository"

import { type CoursesResponse } from "../schemas"

/**
 * Lists all active courses for the authenticated teacher
 * GET /api/classroom/courses
 */
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // Get teacher's stored token
        const tokenRecord = await getTeacherToken(session.user.id)

        if (!tokenRecord) {
            return NextResponse.json(
                { error: "Google Classroom not connected" },
                { status: 403 },
            )
        }

        let accessToken = tokenRecord.accessToken

        // Check if token is expired and refresh if needed
        const now = new Date()
        if (tokenRecord.expiresAt <= now) {
            const refreshed = await refreshAccessToken(tokenRecord.refreshToken)
            accessToken = refreshed.accessToken

            // Update stored token
            await updateTeacherTokenAccess(
                session.user.id,
                refreshed.accessToken,
                refreshed.expiresAt,
            )
        }

        // Fetch courses from Google Classroom
        const courses = await listCourses(accessToken)

        const response: CoursesResponse = { courses }
        return NextResponse.json(response)
    } catch (error) {
        console.error("Error fetching courses:", error)
        return NextResponse.json(
            { error: "Failed to fetch courses" },
            { status: 500 },
        )
    }
}
