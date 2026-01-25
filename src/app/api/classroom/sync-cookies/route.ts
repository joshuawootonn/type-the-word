import { getServerSession } from "next-auth"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import { db } from "~/server/db"

/**
 * Sync classroom cookies based on existing tokens
 * This function can be called directly or via POST request
 */
export async function syncClassroomCookies() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return
    }

    const cookieStore = await cookies()
    const hasTeacherCookie = cookieStore.has("classroomTeacher")
    const hasStudentCookie = cookieStore.has("classroomStudent")

    // Early return if both cookies already exist
    if (hasTeacherCookie && hasStudentCookie) {
        return
    }

    try {
        // Only query for missing cookies
        const [teacherToken, studentToken] = await Promise.all([
            hasTeacherCookie
                ? null
                : db.query.classroomTeacherToken
                      .findFirst({
                          where: (table, { eq }) =>
                              eq(table.userId, session.user.id),
                      })
                      .catch(() => null),
            hasStudentCookie
                ? null
                : db.query.classroomStudentToken
                      .findFirst({
                          where: (table, { eq }) =>
                              eq(table.userId, session.user.id),
                      })
                      .catch(() => null),
        ])

        // Set cookies if tokens exist but cookies don't
        if (teacherToken && !hasTeacherCookie) {
            cookieStore.set("classroomTeacher", "true", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 365, // 1 year
            })
        }

        if (studentToken && !hasStudentCookie) {
            cookieStore.set("classroomStudent", "true", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24 * 365, // 1 year
            })
        }
    } catch (error) {
        console.error("Error syncing classroom cookies:", error)
    }
}

/**
 * POST /api/classroom/sync-cookies
 * HTTP handler that wraps the sync function
 */
export async function POST() {
    await syncClassroomCookies()
    return NextResponse.json({ success: true })
}
