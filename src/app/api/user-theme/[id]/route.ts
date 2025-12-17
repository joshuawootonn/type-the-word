import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { z } from 'zod'

import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import { UserThemeRepository } from '~/server/repositories/userTheme.repository'

export const dynamic = 'force-dynamic' // defaults to auto

const uuidSchema = z.string().uuid()

export const DELETE = async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } },
) {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (uuidSchema.safeParse(params.id).success === false) {
        return Response.json({ error: 'Invalid id' }, { status: 400 })
    }

    const themeRepository = new UserThemeRepository(db)
    await themeRepository.deleteTheme({
        id: params.id,
    })

    const themes = await themeRepository.getMany({ userId: session.user.id })

    return Response.json({ data: themes ?? [] }, { status: 200 })
}
