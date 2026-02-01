import { eq, and } from "drizzle-orm"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import { getValidStudentToken } from "~/server/classroom/student-token"
import { db } from "~/server/db"
import { classroomAssignment, classroomSubmission } from "~/server/db/schema"

import { type StudentAssignmentsResponse } from "../../schemas"

/**
 * Gets assignments for a course with the student's personal progress
 * GET /api/classroom/student/assignments?courseId=xxx
 */
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        await getValidStudentToken(session.user.id)

        const searchParams = request.nextUrl.searchParams
        const courseId = searchParams.get("courseId")

        if (!courseId) {
            return NextResponse.json(
                { error: "courseId is required" },
                { status: 400 },
            )
        }

        // Fetch all assignments for this course with the student's submission data
        const assignmentsWithSubmissions = await db
            .select({
                id: classroomAssignment.id,
                courseId: classroomAssignment.courseId,
                courseWorkId: classroomAssignment.courseWorkId,
                title: classroomAssignment.title,
                description: classroomAssignment.description,
                translation: classroomAssignment.translation,
                book: classroomAssignment.book,
                startChapter: classroomAssignment.startChapter,
                startVerse: classroomAssignment.startVerse,
                endChapter: classroomAssignment.endChapter,
                endVerse: classroomAssignment.endVerse,
                totalVerses: classroomAssignment.totalVerses,
                maxPoints: classroomAssignment.maxPoints,
                dueDate: classroomAssignment.dueDate,
                state: classroomAssignment.state,
                // Student's submission data
                submissionId: classroomSubmission.id,
                completedVerses: classroomSubmission.completedVerses,
                averageWpm: classroomSubmission.averageWpm,
                averageAccuracy: classroomSubmission.averageAccuracy,
                isCompleted: classroomSubmission.isCompleted,
                isTurnedIn: classroomSubmission.isTurnedIn,
                startedAt: classroomSubmission.startedAt,
                completedAt: classroomSubmission.completedAt,
            })
            .from(classroomAssignment)
            .leftJoin(
                classroomSubmission,
                and(
                    eq(
                        classroomSubmission.assignmentId,
                        classroomAssignment.id,
                    ),
                    eq(classroomSubmission.studentUserId, session.user.id),
                ),
            )
            .where(
                and(
                    eq(classroomAssignment.courseId, courseId),
                    eq(classroomAssignment.state, "PUBLISHED"), // Only show published assignments
                ),
            )
            .orderBy(classroomAssignment.dueDate)

        // Group assignments by status
        const now = new Date()
        const current: typeof assignmentsWithSubmissions = []
        const completed: typeof assignmentsWithSubmissions = []
        const pastDue: typeof assignmentsWithSubmissions = []

        for (const assignment of assignmentsWithSubmissions) {
            const isPastDue =
                assignment.dueDate && new Date(assignment.dueDate) < now
            const isCompleted = assignment.isCompleted === 1

            if (isCompleted) {
                completed.push(assignment)
            } else if (isPastDue) {
                pastDue.push(assignment)
            } else {
                current.push(assignment)
            }
        }

        const response: StudentAssignmentsResponse = {
            current: current.map(a => ({
                ...a,
                dueDate: a.dueDate ? a.dueDate.toISOString() : null,
                startedAt: a.startedAt ? a.startedAt.toISOString() : null,
                completedAt: a.completedAt ? a.completedAt.toISOString() : null,
                completionPercentage:
                    a.totalVerses > 0
                        ? Math.round(
                              ((a.completedVerses ?? 0) / a.totalVerses) * 100,
                          )
                        : 0,
                hasStarted: a.submissionId !== null,
            })),
            completed: completed.map(a => ({
                ...a,
                dueDate: a.dueDate ? a.dueDate.toISOString() : null,
                startedAt: a.startedAt ? a.startedAt.toISOString() : null,
                completedAt: a.completedAt ? a.completedAt.toISOString() : null,
                completionPercentage:
                    a.totalVerses > 0
                        ? Math.round(
                              ((a.completedVerses ?? 0) / a.totalVerses) * 100,
                          )
                        : 0,
                hasStarted: a.submissionId !== null,
            })),
            pastDue: pastDue.map(a => ({
                ...a,
                dueDate: a.dueDate ? a.dueDate.toISOString() : null,
                startedAt: a.startedAt ? a.startedAt.toISOString() : null,
                completedAt: a.completedAt ? a.completedAt.toISOString() : null,
                completionPercentage:
                    a.totalVerses > 0
                        ? Math.round(
                              ((a.completedVerses ?? 0) / a.totalVerses) * 100,
                          )
                        : 0,
                hasStarted: a.submissionId !== null,
            })),
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error("Error fetching student assignments:", error)
        return NextResponse.json(
            { error: "Failed to fetch assignments" },
            { status: 500 },
        )
    }
}
