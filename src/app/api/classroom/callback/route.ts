import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { env } from "~/env.mjs"
import {
    exchangeCodeForTokens,
    listCourses,
} from "~/server/clients/classroom.client"
import { db } from "~/server/db"
import { users } from "~/server/db/schema"
import { saveTeacherToken } from "~/server/repositories/classroom.repository"
import {
    ensureTeacherMembershipOnConnect,
    getDomainFromEmail,
    syncTeacherCourseMappings,
} from "~/server/repositories/organization.repository"

/**
 * Handles the OAuth callback from Google
 * GET /api/classroom/callback
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state") // userId
    const error = searchParams.get("error")

    if (error) {
        console.error("OAuth error:", error)
        return NextResponse.redirect(
            new URL(
                `/classroom?error=${encodeURIComponent(error)}`,
                request.url,
            ),
        )
    }

    if (!code || !state) {
        return NextResponse.redirect(
            new URL("/classroom?error=missing_code_or_state", request.url),
        )
    }

    try {
        // Exchange code for tokens
        const redirectUri = `${env.DEPLOYED_URL}/api/classroom/callback`
        console.log("Token exchange redirect URI:", redirectUri)
        const tokens = await exchangeCodeForTokens(code, redirectUri)
        const [user] = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
            })
            .from(users)
            .where(eq(users.id, state))
            .limit(1)

        if (!user) {
            return NextResponse.redirect(
                new URL("/classroom?error=user_not_found", request.url),
            )
        }

        const domain = getDomainFromEmail(user.email)
        if (!domain) {
            return NextResponse.redirect(
                new URL("/classroom?error=invalid_email_domain", request.url),
            )
        }

        const [courses, membership] = await Promise.all([
            listCourses(tokens.accessToken),
            ensureTeacherMembershipOnConnect({
                userId: state,
                domain,
                organizationName: domain,
            }),
        ])

        await syncTeacherCourseMappings({
            organizationId: membership.organization.id,
            teacherUserId: state,
            courseIds: courses.map(course => course.id),
        })

        // Save tokens to database
        await saveTeacherToken({
            userId: state,
            ...tokens,
        })

        const cookieStore = await cookies()
        if (membership.needsApproval) {
            cookieStore.delete("classroomTeacher")
            return NextResponse.redirect(
                new URL("/classroom?pending_teacher=true", request.url),
            )
        }

        // Set cookie to indicate teacher is connected
        cookieStore.set("classroomTeacher", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365, // 1 year
        })

        // Redirect to classroom page with success
        return NextResponse.redirect(
            new URL("/classroom?success=true", request.url),
        )
    } catch (error) {
        console.error("Error exchanging code for tokens:", error)
        return NextResponse.redirect(
            new URL("/classroom?error=token_exchange_failed", request.url),
        )
    }
}
