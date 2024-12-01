import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import {
    ThemeRepository,
    themeRecordSchema,
} from '~/server/repositories/theme.repository'

export const dynamic = 'force-dynamic' // defaults to auto

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawBody = await request.json()

    const body = themeRecordSchema
        .omit({
            id: true,
        })
        .parse({ userId: session.user.id, ...rawBody })

    console.log({ rawBody, body })

    const themeRepository = new ThemeRepository(db)

    const themes = await themeRepository.createTheme(body)

    return Response.json({ data: themes }, { status: 200 })
}

export async function GET() {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const themeRepository = new ThemeRepository(db)
    const themes = await themeRepository.getMany({
        userId: session.user.id,
    })

    if (themes === null) {
        return Response.json({ error: 'Themes not found' }, { status: 404 })
    }

    return Response.json({ data: themes }, { status: 200 })
}
