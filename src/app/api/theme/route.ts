import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import {
    ThemeRepository,
    UniqueConstraintError,
} from '~/server/repositories/theme.repository'
import { themeDTOSchema } from './dto'

export const dynamic = 'force-dynamic' // defaults to auto

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawBody = await request.json()

    const body = themeDTOSchema.safeParse(rawBody)

    if (!body.success) {
        return Response.json({ error: body.error }, { status: 400 })
    }

    const themeRepository = new ThemeRepository(db)

    try {
        const themes = await themeRepository.createTheme({
            ...body.data,
            userId: session.user.id,
        })
        return Response.json({ data: themes }, { status: 200 })
    } catch (e) {
        if (e instanceof UniqueConstraintError) {
            return Response.json({ errors: e.errors }, { status: 422 })
        }
        throw e
    }
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
