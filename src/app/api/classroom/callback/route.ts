import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

import {
    exchangeCodeForTokens,
    getGoogleUserInfo,
} from '~/lib/classroom.service'
import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import { ClassroomRepository } from '~/server/repositories/classroom.repository'

/**
 * OAuth callback for Google Classroom integration
 * Teachers are redirected here after authorizing Classroom access
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
        console.error('OAuth error:', error)
        return NextResponse.redirect(
            new URL(`/classroom/connect?error=${error}`, request.url),
        )
    }

    if (!code) {
        return NextResponse.redirect(
            new URL('/classroom/connect?error=no_code', request.url),
        )
    }

    // Verify user is logged in
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        // Store the state in a cookie and redirect to login
        const response = NextResponse.redirect(
            new URL(
                '/auth/login?callbackUrl=/api/classroom/callback',
                request.url,
            ),
        )
        if (state) {
            response.cookies.set('classroom_oauth_state', state, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 10, // 10 minutes
            })
        }
        return response
    }

    try {
        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code)

        // Get Google user info
        const googleUser = await getGoogleUserInfo(tokens.access_token)

        // Store tokens in database
        const classroomRepo = new ClassroomRepository(db)
        await classroomRepo.upsertTeacherToken({
            userId: session.user.id,
            googleId: googleUser.id,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: tokens.expires_in
                ? new Date(Date.now() + tokens.expires_in * 1000)
                : null,
            scope: tokens.scope,
        })

        // Redirect to success page or back to where they started
        const redirectUrl = state ?? '/classroom/connect?success=true'
        return NextResponse.redirect(new URL(redirectUrl, request.url))
    } catch (err) {
        console.error('Failed to complete OAuth flow:', err)
        return NextResponse.redirect(
            new URL(
                '/classroom/connect?error=token_exchange_failed',
                request.url,
            ),
        )
    }
}
