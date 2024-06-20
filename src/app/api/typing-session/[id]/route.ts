import { eq, sql } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import { typedVerses, typingSessions } from '~/server/db/schema'
import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'

export const dynamic = 'force-dynamic' // defaults to auto

const addTypedVerseBodySchema = createInsertSchema(typedVerses).omit({
    userId: true,
    id: true,
})

const uuidSchema = z.string().uuid()

export const POST = async function POST(
    request: NextRequest,
    { params }: { params: { id: string } },
) {
    const session = await getServerSession(authOptions)

    if (session === null) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('params', params)
    if (uuidSchema.safeParse(params.id).success === false) {
        return Response.json({ error: 'Invalid id' }, { status: 400 })
    }

    let body: z.infer<typeof addTypedVerseBodySchema>
    try {
        body = addTypedVerseBodySchema.parse(await request.json())
    } catch (e) {
        return Response.json({ error: 'Invalid body' }, { status: 400 })
    }

    const verse = addTypedVerseBodySchema.parse(body)
    const typingSessionRepository = new TypingSessionRepository(db)
    let typingSession = await typingSessionRepository.getOne({
        id: params.id,
    })

    await db
        .update(typingSessions)
        .set({
            updatedAt: sql`CURRENT_TIMESTAMP(3)`,
        })
        .where(eq(typingSessions.id, params.id))
    await db.insert(typedVerses).values({
        userId: session.user.id,
        ...verse,
    })

    typingSession = await typingSessionRepository.getOne({
        userId: session.user.id,
    })

    return Response.json({ data: typingSession }, { status: 200 })
}
