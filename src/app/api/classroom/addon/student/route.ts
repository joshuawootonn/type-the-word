import { NextRequest, NextResponse } from 'next/server'

import bibleMetadata from '~/server/bible-metadata.json'
import { db } from '~/server/db'
import { ClassroomRepository } from '~/server/repositories/classroom.repository'

/**
 * Get assignment and student submission for student view
 */
export async function GET(request: NextRequest) {
    const attachmentId = request.nextUrl.searchParams.get('attachmentId')
    const loginHint = request.nextUrl.searchParams.get('loginHint')
    const submissionId = request.nextUrl.searchParams.get('submissionId')

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

        // Calculate total verses
        const bookData =
            bibleMetadata[assignment.book as keyof typeof bibleMetadata]
        const chapterData = bookData?.chapters?.[assignment.chapter - 1]
        const chapterVerseCount = chapterData?.length ?? 0

        let totalVerses: number
        if (assignment.firstVerse && assignment.lastVerse) {
            totalVerses = assignment.lastVerse - assignment.firstVerse + 1
        } else if (assignment.firstVerse) {
            totalVerses = 1
        } else {
            totalVerses = chapterVerseCount
        }

        // Get or create submission for this student
        let submission = null
        if (loginHint) {
            submission = await classroomRepo.getSubmission(
                assignment.id,
                loginHint,
            )

            // If no submission exists, create one
            if (!submission) {
                submission = await classroomRepo.upsertSubmission({
                    assignmentId: assignment.id,
                    studentGoogleId: loginHint,
                    googleSubmissionId: submissionId,
                    versesCompleted: 0,
                    totalVerses,
                })
            }
        }

        return NextResponse.json({
            assignment: {
                id: assignment.id,
                title: assignment.title,
                book: assignment.book,
                chapter: assignment.chapter,
                firstVerse: assignment.firstVerse,
                lastVerse: assignment.lastVerse,
                translation: assignment.translation,
            },
            submission: submission
                ? {
                      versesCompleted: submission.versesCompleted,
                      totalVerses: submission.totalVerses,
                      averageWpm: submission.averageWpm,
                      averageAccuracy: submission.averageAccuracy,
                      completedAt: submission.completedAt,
                  }
                : null,
        })
    } catch (err) {
        console.error('Failed to get student assignment:', err)
        return NextResponse.json(
            { error: 'Failed to get assignment' },
            { status: 500 },
        )
    }
}
