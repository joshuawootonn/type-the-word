import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { getClassroomAuthUrl } from '~/lib/classroom.service'
import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import { ClassroomRepository } from '~/server/repositories/classroom.repository'

/**
 * Check if the current user is connected to Google Classroom
 */
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ connected: false, authenticated: false })
    }

    const classroomRepo = new ClassroomRepository(db)
    const teacherToken = await classroomRepo.getTeacherToken(session.user.id)

    return NextResponse.json({
        connected: !!teacherToken,
        authenticated: true,
        googleId: teacherToken?.googleId,
    })
}

/**
 * Get the OAuth URL to connect to Google Classroom
 */
export async function POST() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const authUrl = getClassroomAuthUrl('/classroom/connect?success=true')
        return NextResponse.json({ authUrl })
    } catch (err) {
        console.error('Failed to generate auth URL:', err)
        return NextResponse.json(
            { error: 'Failed to generate authorization URL' },
            { status: 500 },
        )
    }
}
