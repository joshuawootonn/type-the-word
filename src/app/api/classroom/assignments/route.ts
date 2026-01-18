import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { env } from '~/env.mjs'
import { createCourseWork, refreshAccessToken } from '~/lib/classroom.service'
import { bookSchema } from '~/lib/types/book'
import { authOptions } from '~/server/auth'
import bibleMetadata from '~/server/bible-metadata.json'
import { db } from '~/server/db'
import * as schema from '~/server/db/schema'
import { translationsSchema } from '~/server/db/schema'
import { ClassroomRepository } from '~/server/repositories/classroom.repository'

const createAssignmentSchema = z.object({
    courseId: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional(),
    book: bookSchema,
    chapter: z.number().int().positive(),
    firstVerse: z.number().int().positive().optional(),
    lastVerse: z.number().int().positive().optional(),
    translation: translationsSchema,
    maxPoints: z.number().int().min(0).max(1000).optional().default(100),
})

/**
 * Create a new assignment in Google Classroom
 */
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const classroomRepo = new ClassroomRepository(db)
    const teacherToken = await classroomRepo.getTeacherToken(session.user.id)

    if (!teacherToken) {
        return NextResponse.json(
            { error: 'Not connected to Google Classroom', needsAuth: true },
            { status: 401 },
        )
    }

    // Parse and validate request body
    let body: z.infer<typeof createAssignmentSchema>
    try {
        const json = await request.json()
        body = createAssignmentSchema.parse(json)
    } catch (err) {
        return NextResponse.json(
            { error: 'Invalid request body', details: err },
            { status: 400 },
        )
    }

    try {
        let accessToken = teacherToken.accessToken

        // Refresh token if expired
        if (teacherToken.expiresAt && teacherToken.expiresAt < new Date()) {
            if (!teacherToken.refreshToken) {
                return NextResponse.json(
                    {
                        error: 'Token expired, please reconnect',
                        needsAuth: true,
                    },
                    { status: 401 },
                )
            }

            const newTokens = await refreshAccessToken(
                teacherToken.refreshToken,
            )
            accessToken = newTokens.access_token

            await classroomRepo.upsertTeacherToken({
                userId: session.user.id,
                googleId: teacherToken.googleId,
                accessToken: newTokens.access_token,
                refreshToken:
                    newTokens.refresh_token ?? teacherToken.refreshToken,
                expiresAt: newTokens.expires_in
                    ? new Date(Date.now() + newTokens.expires_in * 1000)
                    : null,
                scope: newTokens.scope ?? teacherToken.scope,
            })
        }

        // Calculate total verses for the assignment
        const bookData = bibleMetadata[body.book as keyof typeof bibleMetadata]
        const chapterData = bookData?.chapters?.[body.chapter - 1]
        const chapterVerseCount = chapterData?.length ?? 0

        let totalVerses: number
        if (body.firstVerse && body.lastVerse) {
            totalVerses = body.lastVerse - body.firstVerse + 1
        } else if (body.firstVerse) {
            totalVerses = 1
        } else {
            totalVerses = chapterVerseCount
        }

        // Save the assignment in our database first to get the ID
        const assignment = await classroomRepo.createAssignment({
            integrationType: 'coursework',
            courseId: body.courseId,
            courseWorkId: null, // Will be updated after courseWork is created
            teacherGoogleId: teacherToken.googleId,
            teacherUserId: session.user.id,
            translation: body.translation,
            book: body.book,
            chapter: body.chapter,
            firstVerse: body.firstVerse,
            lastVerse: body.lastVerse,
            title: body.title,
            maxPoints: body.maxPoints,
        })

        // Build the passage URL with classroomAssignment param
        const passageSegment = `${body.book}_${body.chapter}`
        const verseRange = body.firstVerse
            ? body.lastVerse
                ? `:${body.firstVerse}-${body.lastVerse}`
                : `:${body.firstVerse}`
            : ''

        const urlParams = new URLSearchParams()
        if (body.translation !== 'esv') {
            urlParams.set('translation', body.translation)
        }
        urlParams.set('classroomAssignment', assignment.id)

        const passageUrl = `${env.DEPLOYED_URL}/passage/${passageSegment}${verseRange}?${urlParams.toString()}`

        // Create the assignment in Google Classroom
        const courseWork = await createCourseWork(accessToken, body.courseId, {
            title: body.title,
            description:
                body.description ??
                `Type ${body.book} ${body.chapter}${verseRange} using Type the Word.`,
            workType: 'ASSIGNMENT',
            maxPoints: body.maxPoints,
            materials: [
                {
                    link: {
                        url: passageUrl,
                        title: body.title,
                    },
                },
            ],
        })

        // Update assignment with courseWorkId
        await db
            .update(schema.classroomAssignment)
            .set({ courseWorkId: courseWork.id })
            .where(eq(schema.classroomAssignment.id, assignment.id))

        return NextResponse.json({
            success: true,
            assignment: { ...assignment, courseWorkId: courseWork.id },
            courseWork,
            totalVerses,
        })
    } catch (err) {
        console.error('Failed to create assignment:', err)
        return NextResponse.json(
            { error: 'Failed to create assignment in Google Classroom' },
            { status: 500 },
        )
    }
}

/**
 * List assignments created by the current teacher
 */
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const classroomRepo = new ClassroomRepository(db)
    const assignments = await classroomRepo.getAssignmentsByTeacher(
        session.user.id,
    )

    return NextResponse.json({ assignments })
}
