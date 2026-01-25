import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { exchangeCodeForTokens } from "~/server/clients/classroom.client"
import { saveTeacherToken } from "~/server/repositories/classroom.repository"

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
        const tokens = await exchangeCodeForTokens(
            code,
            `${request.nextUrl.origin}/api/classroom/callback`,
        )

        // Save tokens to database
        await saveTeacherToken({
            userId: state,
            ...tokens,
        })

        // Set cookie to indicate teacher is connected
        const cookieStore = await cookies()
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
