import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import {
    ThemeRepository,
    currentThemeRecordSchema,
} from '~/server/repositories/theme.repository'

export const dynamic = 'force-dynamic' // defaults to auto

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawBody = await request.json()

    const body = currentThemeRecordSchema.parse({
        userId: session.user.id,
        ...rawBody,
    })

    const themeRepository = new ThemeRepository(db)
    const currentTheme = await themeRepository.setCurrentTheme(body)

    return Response.json({ data: currentTheme }, { status: 200 })
}

export async function GET() {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const themeRepository = new ThemeRepository(db)
    const currentTheme = await themeRepository.getCurrentTheme({
        userId: session.user.id,
    })

    if (currentTheme === null) {
        return Response.json({ error: 'User theme not set' }, { status: 404 })
    }

    return Response.json({ data: currentTheme }, { status: 200 })
}
