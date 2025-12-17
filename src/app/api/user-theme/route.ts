import { createSelectSchema } from 'drizzle-zod'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import { theme } from '~/server/db/schema'
import { UserThemeRepository } from '~/server/repositories/userTheme.repository'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userThemeRepository = new UserThemeRepository(db)

    const themes = await userThemeRepository.getMany({
        userId: session.user.id,
    })

    return Response.json({ data: themes }, { status: 200 })
}

const themeRecordSchema = createSelectSchema(theme).omit({ id: true })

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawBody = await request.json()

    const body = themeRecordSchema.safeParse(rawBody)

    if (!body.success) {
        return Response.json({ error: body.error }, { status: 400 })
    }

    const userThemeRepository = new UserThemeRepository(db)
    try {
        const theme = await userThemeRepository.createTheme({
            theme: body.data,
            userId: session.user.id,
        })
        return Response.json({ data: theme }, { status: 200 })
    } catch (e) {
        throw e
    }
}
