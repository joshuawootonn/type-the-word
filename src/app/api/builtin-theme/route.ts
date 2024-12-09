import { db } from '~/server/db'
import { BuiltinThemeRepository } from '~/server/repositories/builtinTheme.repository'

export const dynamic = 'force-static'

export async function GET() {
    const builtinThemeRepository = new BuiltinThemeRepository(db)

    const builtinThemes = await builtinThemeRepository.getMany()

    return Response.json({ data: builtinThemes }, { status: 200 })
}
