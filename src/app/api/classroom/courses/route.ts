import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { listTeacherCourses, refreshAccessToken } from '~/lib/classroom.service'
import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import { ClassroomRepository } from '~/server/repositories/classroom.repository'

/**
 * List courses where the current user is a teacher
 */
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const classroomRepo = new ClassroomRepository(db)
    const teacherToken = await classroomRepo.getTeacherToken(session.user.id)

    if (!teacherToken) {
        return NextResponse.json(
            { error: 'Not connected to Google Classroom', needsAuth: true },
            { status: 401 },
        )
    }

    try {
        let accessToken = teacherToken.accessToken

        // Check if token is expired and refresh if needed
        if (teacherToken.expiresAt && teacherToken.expiresAt < new Date()) {
            if (!teacherToken.refreshToken) {
                // Need to re-authenticate
                return NextResponse.json(
                    {
                        error: 'Token expired, please reconnect',
                        needsAuth: true,
                    },
                    { status: 401 },
                )
            }

            const newTokens = await refreshAccessToken(
                teacherToken.refreshToken,
            )
            accessToken = newTokens.access_token

            // Update stored token
            await classroomRepo.upsertTeacherToken({
                userId: session.user.id,
                googleId: teacherToken.googleId,
                accessToken: newTokens.access_token,
                refreshToken:
                    newTokens.refresh_token ?? teacherToken.refreshToken,
                expiresAt: newTokens.expires_in
                    ? new Date(Date.now() + newTokens.expires_in * 1000)
                    : null,
                scope: newTokens.scope ?? teacherToken.scope,
            })
        }

        const courses = await listTeacherCourses(accessToken)

        return NextResponse.json({ courses })
    } catch (err) {
        console.error('Failed to list courses:', err)
        return NextResponse.json(
            { error: 'Failed to fetch courses from Google Classroom' },
            { status: 500 },
        )
    }
}
