import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import {
    getTeacherToken as getTeacherClassroomToken,
    getStudentToken,
} from "~/server/classroom/classroom.repository"
import { getValidStudentToken } from "~/server/classroom/student-token"
import { getValidTeacherToken } from "~/server/classroom/teacher-token"
import {
    listCourses,
    listStudentCourses,
} from "~/server/clients/classroom.client"
import {
    getApprovedOrganizationForUser,
    syncTeacherCourseMappings,
} from "~/server/repositories/organization.repository"

import { type CoursesResponse } from "../schemas"

/**
 * Lists all active courses for the authenticated user (teacher or student)
 * GET /api/classroom/courses
 */
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // Check if user is a teacher first
        const teacherToken = await getTeacherClassroomToken(
            session.user.id,
        ).catch(() => null)

        if (teacherToken) {
            const approvedOrganization = await getApprovedOrganizationForUser(
                session.user.id,
            )

            if (approvedOrganization) {
                const validToken = await getValidTeacherToken(session.user.id)
                const courses = await listCourses(validToken.accessToken)
                await syncTeacherCourseMappings({
                    organizationId: approvedOrganization.id,
                    teacherUserId: session.user.id,
                    courseIds: courses.map(course => course.id),
                })
                const response: CoursesResponse = { courses }
                return NextResponse.json(response)
            }
        }

        // Check if user is a student
        const studentToken = await getStudentToken(session.user.id).catch(
            () => null,
        )

        if (studentToken) {
            // Student flow
            const validToken = await getValidStudentToken(session.user.id)
            const courses = await listStudentCourses(validToken.accessToken)
            const response: CoursesResponse = { courses }
            return NextResponse.json(response)
        }

        // No Google Classroom connection
        return NextResponse.json(
            { error: "Google Classroom not connected" },
            { status: 403 },
        )
    } catch (error) {
        console.error("Error fetching courses:", error)
        return NextResponse.json(
            { error: "Failed to fetch courses" },
            { status: 500 },
        )
    }
}
