import { getServerSession } from 'next-auth'
import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
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
