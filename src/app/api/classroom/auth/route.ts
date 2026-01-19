import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { authOptions } from '~/server/auth'
import { getAuthUrl } from '~/server/clients/classroom.client'

import { type AuthResponse } from '../schemas'

/**
 * Initiates the OAuth flow for Google Classroom
 * GET /api/classroom/auth
 */
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Generate OAuth URL with user ID as state
        const authUrl = getAuthUrl(session.user.id)

        const response: AuthResponse = { authUrl }
        return NextResponse.json(response)
    } catch (error) {
        console.error('Error generating auth URL:', error)
        return NextResponse.json(
            { error: 'Failed to generate auth URL' },
            { status: 500 },
        )
    }
}
