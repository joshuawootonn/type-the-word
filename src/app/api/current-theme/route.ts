import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import {
    CurrentThemeRepository,
    currentThemeRecordSchema,
    currentThemeSchema,
} from '~/server/repositories/currentTheme.repository'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentThemeRepository = new CurrentThemeRepository(db)

    const themes = await currentThemeRepository.getCurrentTheme({
        userId: session.user.id,
    })

    return Response.json({ data: themes }, { status: 200 })
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawBody = await request.json()

    const body = currentThemeSchema.parse({
        userId: session.user.id,
        ...rawBody,
    })

    const themeRepository = new CurrentThemeRepository(db)
    const currentTheme = await themeRepository.setCurrentTheme(body)

    return Response.json({ data: currentTheme }, { status: 200 })
}
