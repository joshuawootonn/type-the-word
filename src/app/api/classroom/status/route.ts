import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { authOptions } from '~/server/auth'
import { getTeacherToken } from '~/server/repositories/classroom.repository'

import { type StatusResponse } from '../schemas'

/**
 * Check if user has connected Google Classroom
 * GET /api/classroom/status
 */
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const token = await getTeacherToken(session.user.id)
        const response: StatusResponse = { connected: !!token }
        return NextResponse.json(response)
    } catch (error) {
        console.error('Error checking classroom status:', error)
        return NextResponse.json(
            { error: 'Failed to check status' },
            { status: 500 },
        )
    }
}
