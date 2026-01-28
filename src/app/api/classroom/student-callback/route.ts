import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { env } from "~/env.mjs"
import { exchangeCodeForTokens } from "~/server/clients/classroom.client"
import { getGoogleUserId } from "~/server/clients/google.client"
import { saveStudentToken } from "~/server/repositories/classroom.repository"

/**
 * Handles the OAuth callback from Google (student)
 * GET /api/classroom/student-callback
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error) {
        console.error("Student OAuth error:", error)
        return NextResponse.redirect(
            new URL(
                `/classroom?student_error=${encodeURIComponent(error)}`,
                request.url,
            ),
        )
    }

    if (!code || !state) {
        return NextResponse.redirect(
            new URL(
                "/classroom?student_error=missing_code_or_state",
                request.url,
            ),
        )
    }

    try {
        const tokens = await exchangeCodeForTokens(
            code,
            `${env.DEPLOYED_URL}/api/classroom/student-callback`,
        )
        const googleUserId = await getGoogleUserId(tokens.accessToken)

        await saveStudentToken({
            userId: state,
            googleUserId,
            ...tokens,
        })

        // Set cookie to indicate student is connected
        const cookieStore = await cookies()
        cookieStore.set("classroomStudent", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365, // 1 year
        })

        return NextResponse.redirect(
            new URL("/classroom?student_success=true", request.url),
        )
    } catch (error) {
        console.error("Error exchanging student code for tokens:", error)
        return NextResponse.redirect(
            new URL(
                "/classroom?student_error=token_exchange_failed",
                request.url,
            ),
        )
    }
}
