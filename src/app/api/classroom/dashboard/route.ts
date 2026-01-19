import { eq, and, sql } from "drizzle-orm"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import { db } from "~/server/db"
import { classroomAssignment, classroomSubmission } from "~/server/db/schema"
import { getTeacherToken } from "~/server/repositories/classroom.repository"

import { type DashboardResponse } from "../schemas"

/**
 * Gets assignments for a course with submission stats
 * GET /api/classroom/dashboard?courseId=xxx
 */
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // Check if teacher is connected
        const token = await getTeacherToken(session.user.id)

        if (!token) {
            return NextResponse.json(
                { error: "Google Classroom not connected" },
                { status: 403 },
            )
        }

        const searchParams = request.nextUrl.searchParams
        const courseId = searchParams.get("courseId")

        if (!courseId) {
            return NextResponse.json(
                { error: "courseId is required" },
                { status: 400 },
            )
        }

        // Fetch assignments for this course with submission stats
        const assignments = await db
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
                submissionCount: sql<number>`CAST(COUNT(${classroomSubmission.id}) AS INTEGER)`,
                completedCount: sql<number>`CAST(SUM(CASE WHEN ${classroomSubmission.isCompleted} = 1 THEN 1 ELSE 0 END) AS INTEGER)`,
                averageCompletion: sql<number>`
                    CAST(
                        COALESCE(
                            AVG(
                                CAST(${classroomSubmission.completedVerses} AS FLOAT) / 
                                NULLIF(CAST(${classroomSubmission.totalVerses} AS FLOAT), 0) * 100
                            ),
                            0
                        ) AS INTEGER
                    )
                `,
            })
            .from(classroomAssignment)
            .leftJoin(
                classroomSubmission,
                eq(classroomSubmission.assignmentId, classroomAssignment.id),
            )
            .where(
                and(
                    eq(classroomAssignment.teacherUserId, session.user.id),
                    eq(classroomAssignment.courseId, courseId),
                ),
            )
            .groupBy(classroomAssignment.id)
            .orderBy(classroomAssignment.createdAt)

        const response: DashboardResponse = {
            assignments: assignments.map(a => ({
                ...a,
                dueDate: a.dueDate ? a.dueDate.toISOString() : null,
            })),
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error("Error fetching dashboard:", error)
        return NextResponse.json(
            { error: "Failed to fetch dashboard" },
            { status: 500 },
        )
    }
}
