import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { env } from '~/env.mjs'
import { bookSchema } from '~/lib/types/book'
import bibleMetadata from '~/server/bible-metadata.json'
import { db } from '~/server/db'
import { translationsSchema } from '~/server/db/schema'
import { ClassroomRepository } from '~/server/repositories/classroom.repository'

const createAttachmentSchema = z.object({
    courseId: z.string().min(1),
    itemId: z.string().optional(),
    loginHint: z.string().email().optional(),
    title: z.string().min(1),
    book: bookSchema,
    chapter: z.number().int().positive(),
    firstVerse: z.number().int().positive().optional(),
    lastVerse: z.number().int().positive().optional(),
    translation: translationsSchema,
})

/**
 * Create a new add-on attachment
 * Called from the Attachment Setup iframe
 */
export async function POST(request: NextRequest) {
    let body: z.infer<typeof createAttachmentSchema>
    try {
        const json = await request.json()
        body = createAttachmentSchema.parse(json)
    } catch (err) {
        return NextResponse.json(
            { error: 'Invalid request body', details: err },
            { status: 400 },
        )
    }

    try {
        const classroomRepo = new ClassroomRepository(db)

        // Calculate total verses
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

        // Generate a unique attachment ID
        const attachmentId = crypto.randomUUID()

        // Build the student/teacher view URLs
        const baseUrl = env.DEPLOYED_URL
        const teacherViewUrl = `${baseUrl}/classroom/teacher?attachmentId=${attachmentId}`
        const studentViewUrl = `${baseUrl}/classroom/student?attachmentId=${attachmentId}`

        // Create the assignment in our database
        const assignment = await classroomRepo.createAssignment({
            integrationType: 'addon',
            courseId: body.courseId,
            attachmentId,
            itemId: body.itemId,
            teacherGoogleId: body.loginHint ?? 'unknown',
            translation: body.translation,
            book: body.book,
            chapter: body.chapter,
            firstVerse: body.firstVerse,
            lastVerse: body.lastVerse,
            title: body.title,
            maxPoints: 100,
        })

        return NextResponse.json({
            success: true,
            attachment: {
                id: attachmentId,
                teacherViewUrl,
                studentViewUrl,
                title: body.title,
            },
            assignment,
            totalVerses,
        })
    } catch (err) {
        console.error('Failed to create attachment:', err)
        return NextResponse.json(
            { error: 'Failed to create attachment' },
            { status: 500 },
        )
    }
}

/**
 * Get an attachment by ID (for teacher view)
 */
export async function GET(request: NextRequest) {
    const attachmentId = request.nextUrl.searchParams.get('attachmentId')

    if (!attachmentId) {
        return NextResponse.json(
            { error: 'Missing attachmentId' },
            { status: 400 },
        )
    }

    try {
        const classroomRepo = new ClassroomRepository(db)
        const assignment =
            await classroomRepo.getAssignmentByAttachmentId(attachmentId)

        if (!assignment) {
            return NextResponse.json(
                { error: 'Assignment not found' },
                { status: 404 },
            )
        }

        return NextResponse.json({ assignment })
    } catch (err) {
        console.error('Failed to get attachment:', err)
        return NextResponse.json(
            { error: 'Failed to get attachment' },
            { status: 500 },
        )
    }
}
