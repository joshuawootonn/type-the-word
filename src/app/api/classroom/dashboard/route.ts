import { eq, and, sql } from "drizzle-orm"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import { getValidTeacherToken } from "~/server/classroom/teacher-token"
import { getCourseWork } from "~/server/clients/classroom.client"
import { db } from "~/server/db"
import { classroomAssignment, classroomSubmission } from "~/server/db/schema"

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
        const token = await getValidTeacherToken(session.user.id)

        const searchParams = request.nextUrl.searchParams
        const courseId = searchParams.get("courseId")
        const limit = parseInt(searchParams.get("limit") ?? "5")
        const startingAfter = parseInt(searchParams.get("startingAfter") ?? "0")
        const status = searchParams.get("status") as
            | "current"
            | "draft"
            | "archived"
            | null

        if (!courseId) {
            return NextResponse.json(
                { error: "courseId is required" },
                { status: 400 },
            )
        }

        if (!status) {
            return NextResponse.json(
                { error: "status is required" },
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

        // Group assignments by status
        const now = new Date()
        const grouped = {
            current: assignments.filter(
                a =>
                    a.state === "PUBLISHED" &&
                    (!a.dueDate || new Date(a.dueDate) >= now),
            ),
            draft: assignments.filter(a => a.state === "DRAFT"),
            archived: assignments.filter(
                a =>
                    (a.state === "PUBLISHED" &&
                        a.dueDate &&
                        new Date(a.dueDate) < now) ||
                    a.state === "DELETED",
            ),
        }

        // Get assignments for the requested status and page
        const statusAssignments = grouped[status]
        const offset = startingAfter * limit
        const assignmentsToSync = statusAssignments.slice(
            offset,
            offset + limit,
        )

        // Sync with Google Classroom API and filter out status changes
        const syncedAssignments = await Promise.all(
            assignmentsToSync.map(async assignment => {
                try {
                    const courseWork = await getCourseWork(
                        token.accessToken,
                        assignment.courseId,
                        assignment.courseWorkId,
                    )

                    let dueDate: Date | null = null
                    if (courseWork.dueDate) {
                        const hours = courseWork.dueTime?.hours ?? 23
                        const minutes = courseWork.dueTime?.minutes ?? 59
                        dueDate = new Date(
                            courseWork.dueDate.year,
                            courseWork.dueDate.month - 1,
                            courseWork.dueDate.day,
                            hours,
                            minutes,
                        )
                    }

                    const nextState =
                        courseWork.state === "DRAFT" ||
                        courseWork.state === "PUBLISHED" ||
                        courseWork.state === "DELETED"
                            ? courseWork.state
                            : assignment.state

                    // Update DB if state or date changed
                    if (
                        nextState !== assignment.state ||
                        (dueDate &&
                            assignment.dueDate?.getTime() !== dueDate.getTime())
                    ) {
                        await db
                            .update(classroomAssignment)
                            .set({
                                state: nextState,
                                dueDate: dueDate ?? assignment.dueDate,
                                updatedAt: new Date(),
                            })
                            .where(eq(classroomAssignment.id, assignment.id))
                    }

                    return {
                        ...assignment,
                        state: nextState,
                        dueDate: dueDate ?? assignment.dueDate,
                    }
                } catch (_error) {
                    return assignment
                }
            }),
        )

        // Filter out assignments whose status changed after syncing
        const filteredAssignments = syncedAssignments.filter(a => {
            if (status === "current") {
                return (
                    a.state === "PUBLISHED" &&
                    (!a.dueDate || new Date(a.dueDate) >= now)
                )
            } else if (status === "draft") {
                return a.state === "DRAFT"
            } else if (status === "archived") {
                return (
                    (a.state === "PUBLISHED" &&
                        a.dueDate &&
                        new Date(a.dueDate) < now) ||
                    a.state === "DELETED"
                )
            }
            return false
        })

        const hasMore = offset + limit < statusAssignments.length

        const response: DashboardResponse = {
            assignments: filteredAssignments.map(a => ({
                ...a,
                dueDate: a.dueDate ? a.dueDate.toISOString() : null,
            })),
            total: statusAssignments.length,
            hasMore,
            startingAfter: hasMore ? startingAfter + limit : null,
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
