import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import {
    patchStudentSubmissionGrade,
    returnStudentSubmission,
    refreshAccessToken,
} from '~/lib/classroom.service'
import { db } from '~/server/db'
import { ClassroomRepository } from '~/server/repositories/classroom.repository'

const updateProgressSchema = z.object({
    attachmentId: z.string().min(1),
    studentGoogleId: z.string().min(1),
    googleSubmissionId: z.string().optional(),
    versesCompleted: z.number().int().min(0),
    totalVerses: z.number().int().positive(),
    averageWpm: z.number().int().min(0).optional(),
    averageAccuracy: z.number().int().min(0).max(100).optional(),
    completed: z.boolean().optional(),
})

/**
 * Update student progress for a classroom assignment
 * Called when a student types verses on the passage page
 */
export async function POST(request: NextRequest) {
    let body: z.infer<typeof updateProgressSchema>
    try {
        const json = await request.json()
        body = updateProgressSchema.parse(json)
    } catch (err) {
        return NextResponse.json(
            { error: 'Invalid request body', details: err },
            { status: 400 },
        )
    }

    try {
        const classroomRepo = new ClassroomRepository(db)

        // Get the assignment
        const assignment = await classroomRepo.getAssignmentByAttachmentId(
            body.attachmentId,
        )

        if (!assignment) {
            return NextResponse.json(
                { error: 'Assignment not found' },
                { status: 404 },
            )
        }

        // Calculate grade based on completion
        const completionRate = (body.versesCompleted / body.totalVerses) * 100
        let grade = Math.round(completionRate)

        // Bonus for high accuracy (optional enhancement)
        if (body.averageAccuracy && body.averageAccuracy >= 95) {
            grade = Math.min(100, grade + 5)
        }

        // Update submission
        const submission = await classroomRepo.upsertSubmission({
            assignmentId: assignment.id,
            studentGoogleId: body.studentGoogleId,
            googleSubmissionId: body.googleSubmissionId,
            versesCompleted: body.versesCompleted,
            totalVerses: body.totalVerses,
            averageWpm: body.averageWpm,
            averageAccuracy: body.averageAccuracy,
            completedAt: body.completed ? new Date() : null,
            grade,
        })

        // If completed and this is a CourseWork integration, submit grade to Classroom
        if (
            body.completed &&
            assignment.integrationType === 'coursework' &&
            assignment.courseWorkId &&
            submission.googleSubmissionId
        ) {
            // Get teacher token for API calls
            if (assignment.teacherUserId) {
                const teacherToken = await classroomRepo.getTeacherToken(
                    assignment.teacherUserId,
                )

                if (teacherToken) {
                    try {
                        let accessToken = teacherToken.accessToken

                        // Refresh if expired
                        if (
                            teacherToken.expiresAt &&
                            teacherToken.expiresAt < new Date() &&
                            teacherToken.refreshToken
                        ) {
                            const newTokens = await refreshAccessToken(
                                teacherToken.refreshToken,
                            )
                            accessToken = newTokens.access_token

                            await classroomRepo.upsertTeacherToken({
                                userId: assignment.teacherUserId,
                                googleId: teacherToken.googleId,
                                accessToken: newTokens.access_token,
                                refreshToken:
                                    newTokens.refresh_token ??
                                    teacherToken.refreshToken,
                                expiresAt: newTokens.expires_in
                                    ? new Date(
                                          Date.now() +
                                              newTokens.expires_in * 1000,
                                      )
                                    : null,
                                scope: newTokens.scope ?? teacherToken.scope,
                            })
                        }

                        // Submit grade
                        const scaledGrade =
                            (grade / 100) * (assignment.maxPoints ?? 100)
                        await patchStudentSubmissionGrade(
                            accessToken,
                            assignment.courseId,
                            assignment.courseWorkId,
                            submission.googleSubmissionId,
                            scaledGrade,
                        )

                        // Return the submission to student
                        await returnStudentSubmission(
                            accessToken,
                            assignment.courseId,
                            assignment.courseWorkId,
                            submission.googleSubmissionId,
                        )

                        // Update grade submitted timestamp
                        await classroomRepo.updateSubmissionGrade(
                            submission.id,
                            grade,
                            new Date(),
                        )
                    } catch (gradeError) {
                        console.error(
                            'Failed to submit grade to Classroom:',
                            gradeError,
                        )
                        // Don't fail the request - grade submission is best-effort
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            submission: {
                versesCompleted: submission.versesCompleted,
                totalVerses: submission.totalVerses,
                averageWpm: submission.averageWpm,
                averageAccuracy: submission.averageAccuracy,
                completedAt: submission.completedAt,
                grade: submission.grade,
            },
        })
    } catch (err) {
        console.error('Failed to update progress:', err)
        return NextResponse.json(
            { error: 'Failed to update progress' },
            { status: 500 },
        )
    }
}
