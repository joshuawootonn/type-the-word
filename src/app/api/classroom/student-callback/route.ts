import { NextRequest, NextResponse } from "next/server"

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
            `${request.nextUrl.origin}/api/classroom/student-callback`,
        )
        const googleUserId = await getGoogleUserId(tokens.accessToken)

        await saveStudentToken({
            userId: state,
            googleUserId,
            ...tokens,
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
