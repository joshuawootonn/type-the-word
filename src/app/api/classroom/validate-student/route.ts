import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

import {
    listCourseStudents,
    refreshAccessToken,
    listStudentSubmissions,
} from '~/lib/classroom.service'
import { authOptions } from '~/server/auth'
import { db } from '~/server/db'
import { ClassroomRepository } from '~/server/repositories/classroom.repository'

/**
 * Validate that a student is enrolled in a CourseWork assignment's course
 * Returns student's Google Classroom user ID if enrolled
 */
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session.user.email) {
        return NextResponse.json(
            { enrolled: false, error: 'Not logged in' },
            { status: 401 },
        )
    }

    const assignmentId = request.nextUrl.searchParams.get('assignmentId')
    if (!assignmentId) {
        return NextResponse.json(
            { enrolled: false, error: 'Missing assignmentId' },
            { status: 400 },
        )
    }

    try {
        const classroomRepo = new ClassroomRepository(db)
        const assignment = await classroomRepo.getAssignment(assignmentId)

        if (!assignment) {
            return NextResponse.json(
                { enrolled: false, error: 'Assignment not found' },
                { status: 404 },
            )
        }

        // Only for CourseWork assignments
        if (assignment.integrationType !== 'coursework') {
            return NextResponse.json(
                { enrolled: false, error: 'Invalid assignment type' },
                { status: 400 },
            )
        }

        if (!assignment.teacherUserId) {
            return NextResponse.json(
                {
                    enrolled: false,
                    error: 'Teacher not connected to Type the Word',
                },
                { status: 400 },
            )
        }

        // Get teacher token
        const teacherToken = await classroomRepo.getTeacherToken(
            assignment.teacherUserId,
        )

        if (!teacherToken) {
            return NextResponse.json(
                { enrolled: false, error: 'Teacher token not found' },
                { status: 500 },
            )
        }

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
                    newTokens.refresh_token ?? teacherToken.refreshToken,
                expiresAt: newTokens.expires_in
                    ? new Date(Date.now() + newTokens.expires_in * 1000)
                    : null,
                scope: newTokens.scope ?? teacherToken.scope,
            })
        }

        // List students in the course
        const students = await listCourseStudents(
            accessToken,
            assignment.courseId,
        )

        // Check if logged-in user's email matches any student
        const studentMatch = students.find(
            student =>
                student.profile.emailAddress?.toLowerCase() ===
                session.user.email?.toLowerCase(),
        )

        if (!studentMatch) {
            return NextResponse.json(
                {
                    enrolled: false,
                    error: 'You are not enrolled in this course',
                },
                { status: 403 },
            )
        }

        // Get or create submission record
        const submission = await classroomRepo.upsertSubmission({
            assignmentId: assignment.id,
            studentGoogleId: studentMatch.userId,
            studentUserId: session.user.id,
            googleSubmissionId: undefined, // Will be fetched if needed
            versesCompleted: 0,
            totalVerses:
                assignment.firstVerse && assignment.lastVerse
                    ? assignment.lastVerse - assignment.firstVerse + 1
                    : assignment.firstVerse
                      ? 1
                      : 0, // Will be calculated properly later
        })

        // Fetch the student's submission ID from Classroom for grade passback
        if (assignment.courseWorkId) {
            try {
                const submissions = await listStudentSubmissions(
                    accessToken,
                    assignment.courseId,
                    assignment.courseWorkId,
                )

                const studentSubmission = submissions.find(
                    sub => sub.userId === studentMatch.userId,
                )

                if (
                    studentSubmission &&
                    studentSubmission.id !== submission.googleSubmissionId
                ) {
                    // Update submission with Google submission ID
                    await classroomRepo.upsertSubmission({
                        assignmentId: assignment.id,
                        studentGoogleId: studentMatch.userId,
                        studentUserId: session.user.id,
                        googleSubmissionId: studentSubmission.id,
                        versesCompleted: submission.versesCompleted,
                        totalVerses: submission.totalVerses,
                    })
                }
            } catch (error) {
                console.warn('Failed to fetch student submission ID:', error)
                // Non-critical, continue
            }
        }

        return NextResponse.json({
            enrolled: true,
            studentGoogleId: studentMatch.userId,
            submissionId: submission.id,
        })
    } catch (err) {
        console.error('Failed to validate student enrollment:', err)
        return NextResponse.json(
            { enrolled: false, error: 'Failed to validate enrollment' },
            { status: 500 },
        )
    }
}
