import { eq, and, sql, or, gte, lt, isNull } from "drizzle-orm"
import { getServerSession } from "next-auth"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"

import { env } from "~/env.mjs"
import {
    countVersesInRange,
    validatePassageRange,
} from "~/lib/validate-passage-range"
import { authOptions } from "~/server/auth"
import { getValidStudentToken } from "~/server/classroom/student-token"
import { syncFutureAssignments } from "~/server/classroom/sync-assignments"
import { getValidTeacherToken } from "~/server/classroom/teacher-token"
import {
    createCourseWork,
    refreshAccessToken,
} from "~/server/clients/classroom.client"
import { db } from "~/server/db"
import {
    classroomAssignment,
    classroomSubmission,
    type Book,
} from "~/server/db/schema"
import {
    getTeacherToken,
    getStudentToken,
    createAssignment,
    updateTeacherTokenAccess,
} from "~/server/repositories/classroom.repository"

import {
    type AssignmentsResponse,
    createAssignmentRequestSchema,
    type CreateAssignmentResponse,
} from "../schemas"

/**
 * Unified endpoint for getting assignments - works for both teachers and students
 * GET /api/classroom/assignments?courseId=xxx&page=0&limit=10
 */
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const searchParams = request.nextUrl.searchParams
        const courseId = searchParams.get("courseId")
        const page = parseInt(searchParams.get("page") ?? "0")
        const limit = parseInt(searchParams.get("limit") ?? "10")

        if (!courseId) {
            return NextResponse.json(
                { error: "courseId is required" },
                { status: 400 },
            )
        }

        // Determine user role
        const teacherToken = await getTeacherToken(session.user.id).catch(
            () => null,
        )
        const studentToken = await getStudentToken(session.user.id).catch(
            () => null,
        )

        if (!teacherToken && !studentToken) {
            return NextResponse.json(
                { error: "Google Classroom not connected" },
                { status: 403 },
            )
        }

        const isTeacher = !!teacherToken

        if (isTeacher) {
            // TEACHER FLOW

            // Sync assignments that haven't been synced in the last hour
            try {
                const token = await getValidTeacherToken(session.user.id)
                const now = new Date()
                const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

                // Get assignments that need syncing:
                // - DRAFT or future due dates
                // - AND (never synced OR last synced > 1 hour ago)
                const assignmentsToSync = await db
                    .select({
                        id: classroomAssignment.id,
                        courseId: classroomAssignment.courseId,
                        courseWorkId: classroomAssignment.courseWorkId,
                        title: classroomAssignment.title,
                        description: classroomAssignment.description,
                        dueDate: classroomAssignment.dueDate,
                        state: classroomAssignment.state,
                    })
                    .from(classroomAssignment)
                    .where(
                        and(
                            eq(
                                classroomAssignment.teacherUserId,
                                session.user.id,
                            ),
                            eq(classroomAssignment.courseId, courseId),
                            or(
                                eq(classroomAssignment.state, "DRAFT"),
                                gte(classroomAssignment.dueDate, now),
                            ),
                            or(
                                isNull(classroomAssignment.lastSyncedAt),
                                lt(
                                    classroomAssignment.lastSyncedAt,
                                    oneHourAgo,
                                ),
                            ),
                        ),
                    )

                if (assignmentsToSync.length > 0) {
                    await syncFutureAssignments(
                        token.accessToken,
                        assignmentsToSync,
                    )

                    // Update lastSyncedAt for all synced assignments
                    await Promise.all(
                        assignmentsToSync.map(assignment =>
                            db
                                .update(classroomAssignment)
                                .set({ lastSyncedAt: now })
                                .where(
                                    eq(classroomAssignment.id, assignment.id),
                                ),
                        ),
                    )
                }
            } catch (error) {
                console.error("Error syncing with Google Classroom:", error)
                // Continue with request even if sync fails
            }

            // Get total count
            const countResult = await db
                .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
                .from(classroomAssignment)
                .where(
                    and(
                        eq(classroomAssignment.teacherUserId, session.user.id),
                        eq(classroomAssignment.courseId, courseId),
                    ),
                )
            const totalCount = countResult[0]?.count ?? 0

            // Fetch paginated assignments with submission stats
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
                    eq(
                        classroomSubmission.assignmentId,
                        classroomAssignment.id,
                    ),
                )
                .where(
                    and(
                        eq(classroomAssignment.teacherUserId, session.user.id),
                        eq(classroomAssignment.courseId, courseId),
                    ),
                )
                .groupBy(classroomAssignment.id)
                .orderBy(
                    // Newest assignments first by creation timestamp.
                    sql`${classroomAssignment.createdAt} DESC`,
                )
                .limit(limit)
                .offset(page * limit)

            const response: AssignmentsResponse = {
                assignments: assignments.map(a => ({
                    ...a,
                    dueDate: a.dueDate ? a.dueDate.toISOString() : null,
                })),
                pagination: {
                    page,
                    limit,
                    total: totalCount,
                    hasMore: (page + 1) * limit < totalCount,
                },
            }

            return NextResponse.json(response)
        } else {
            // STUDENT FLOW

            // Sync assignments that haven't been synced in the last hour
            try {
                const token = await getValidStudentToken(session.user.id)
                const now = new Date()
                const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

                // Get assignments that need syncing:
                // - PUBLISHED and future due dates
                // - AND (never synced OR last synced > 1 hour ago)
                const assignmentsToSync = await db
                    .select({
                        id: classroomAssignment.id,
                        courseId: classroomAssignment.courseId,
                        courseWorkId: classroomAssignment.courseWorkId,
                        title: classroomAssignment.title,
                        description: classroomAssignment.description,
                        dueDate: classroomAssignment.dueDate,
                        state: classroomAssignment.state,
                    })
                    .from(classroomAssignment)
                    .where(
                        and(
                            eq(classroomAssignment.courseId, courseId),
                            eq(classroomAssignment.state, "PUBLISHED"),
                            gte(classroomAssignment.dueDate, now),
                            or(
                                isNull(classroomAssignment.lastSyncedAt),
                                lt(
                                    classroomAssignment.lastSyncedAt,
                                    oneHourAgo,
                                ),
                            ),
                        ),
                    )

                if (assignmentsToSync.length > 0) {
                    await syncFutureAssignments(
                        token.accessToken,
                        assignmentsToSync,
                    )

                    // Update lastSyncedAt for all synced assignments
                    await Promise.all(
                        assignmentsToSync.map(assignment =>
                            db
                                .update(classroomAssignment)
                                .set({ lastSyncedAt: now })
                                .where(
                                    eq(classroomAssignment.id, assignment.id),
                                ),
                        ),
                    )
                }
            } catch (error) {
                console.error("Error syncing with Google Classroom:", error)
                // Continue with request even if sync fails
            }

            // Get total count
            const countResult = await db
                .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
                .from(classroomAssignment)
                .where(
                    and(
                        eq(classroomAssignment.courseId, courseId),
                        eq(classroomAssignment.state, "PUBLISHED"),
                    ),
                )
            const totalCount = countResult[0]?.count ?? 0

            // Fetch paginated published assignments with student's submission data
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
                        eq(classroomAssignment.state, "PUBLISHED"),
                    ),
                )
                .orderBy(sql`${classroomAssignment.dueDate} NULLS LAST`)
                .limit(limit)
                .offset(page * limit)

            const response: AssignmentsResponse = {
                assignments: assignments.map(a => ({
                    ...a,
                    dueDate: a.dueDate ? a.dueDate.toISOString() : null,
                    startedAt: a.startedAt ? a.startedAt.toISOString() : null,
                    completedAt: a.completedAt
                        ? a.completedAt.toISOString()
                        : null,
                    completionPercentage:
                        a.totalVerses > 0
                            ? Math.round(
                                  ((a.completedVerses ?? 0) / a.totalVerses) *
                                      100,
                              )
                            : 0,
                    hasStarted: a.submissionId !== null,
                })),
                pagination: {
                    page,
                    limit,
                    total: totalCount,
                    hasMore: (page + 1) * limit < totalCount,
                },
            }

            return NextResponse.json(response)
        }
    } catch (error) {
        console.error("Error fetching assignments:", error)
        return NextResponse.json(
            { error: "Failed to fetch assignments" },
            { status: 500 },
        )
    }
}

/**
 * Creates a new assignment in our DB and in Google Classroom
 * POST /api/classroom/assignments
 */
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // Parse and validate request body
        const body = await request.json()
        const data = createAssignmentRequestSchema.parse(body)

        // Validate passage range
        const rangeValidation = await validatePassageRange(
            {
                book: data.book as Book,
                startChapter: data.startChapter,
                startVerse: data.startVerse,
                endChapter: data.endChapter,
                endVerse: data.endVerse,
            },
            data.translation,
        )

        if (!rangeValidation.valid) {
            return NextResponse.json(
                { error: rangeValidation.error ?? "Invalid passage range" },
                { status: 400 },
            )
        }

        // Calculate total verses in range
        const totalVerses = await countVersesInRange(
            {
                book: data.book as Book,
                startChapter: data.startChapter,
                startVerse: data.startVerse,
                endChapter: data.endChapter,
                endVerse: data.endVerse,
            },
            data.translation,
        )

        console.log(`Assignment will contain ${totalVerses} verses`)

        // Get teacher's stored token
        const tokenRecord = await getTeacherToken(session.user.id)

        if (!tokenRecord) {
            return NextResponse.json(
                { error: "Google Classroom not connected" },
                { status: 403 },
            )
        }

        let accessToken = tokenRecord.accessToken

        // Check if token is expired and refresh if needed
        const now = new Date()
        if (tokenRecord.expiresAt <= now) {
            const refreshed = await refreshAccessToken(tokenRecord.refreshToken)
            accessToken = refreshed.accessToken

            await updateTeacherTokenAccess(
                session.user.id,
                refreshed.accessToken,
                refreshed.expiresAt,
            )
        }

        // Build passage reference for description (if no description provided)
        const bookName = data.book.split("_").join(" ")
        const reference =
            data.startChapter === data.endChapter
                ? `${data.startChapter}:${data.startVerse}-${data.endVerse}`
                : `${data.startChapter}:${data.startVerse}-${data.endChapter}:${data.endVerse}`
        const passageRef = `${bookName} ${reference}`

        // Parse due date and time if provided
        // Set time to end of day (11:59 PM) in teacher's timezone
        let dueDateObj: { year: number; month: number; day: number } | undefined
        let dueTimeObj: { hours: number; minutes: number } | undefined

        if (data.dueDate) {
            // Get teacher's timezone offset from cookie (in minutes)
            const cookieStore = await cookies()
            const timezoneOffset = parseInt(
                cookieStore.get("timezoneOffset")?.value ?? "0",
            )

            // Parse date (format: "YYYY-MM-DD")
            // Create date at 11:59 PM in teacher's local timezone
            const localDate = new Date(data.dueDate + "T23:59:00")

            // Adjust for timezone offset to get UTC time
            // getTimezoneOffset() returns positive for behind UTC
            // e.g., UTC-6 returns 360 minutes
            const utcDate = new Date(
                localDate.getTime() + timezoneOffset * 60 * 1000,
            )

            dueDateObj = {
                year: utcDate.getFullYear(),
                month: utcDate.getMonth() + 1,
                day: utcDate.getDate(),
            }
            dueTimeObj = {
                hours: utcDate.getHours(),
                minutes: utcDate.getMinutes(),
            }
        }

        const assignmentId = crypto.randomUUID()

        // Create CourseWork in Google Classroom as DRAFT
        const courseWork = await createCourseWork(accessToken, data.courseId, {
            title: data.title,
            description: data.description || `Type ${passageRef}`,
            workType: "ASSIGNMENT",
            state: "DRAFT",
            maxPoints: data.maxPoints,
            dueDate: dueDateObj,
            dueTime: dueTimeObj,
            materials: [
                {
                    link: {
                        url: `${env.DEPLOYED_URL}/classroom/${data.courseId}/assignment/${assignmentId}`,
                        title: "Start Assignment",
                    },
                },
            ],
        })

        // Create assignment record in our database as DRAFT
        const assignment = await createAssignment({
            id: assignmentId,
            teacherUserId: session.user.id,
            courseId: data.courseId,
            courseWorkId: courseWork.id,
            title: data.title,
            description: data.description,
            translation: data.translation,
            book: data.book as Book,
            startChapter: data.startChapter,
            startVerse: data.startVerse,
            endChapter: data.endChapter,
            endVerse: data.endVerse,
            totalVerses,
            maxPoints: data.maxPoints,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            state: "DRAFT",
        })

        const response: CreateAssignmentResponse = {
            assignmentId: assignment.id,
            courseWorkId: courseWork.id,
            courseWorkLink: courseWork.alternateLink,
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error("Error creating assignment:", error)

        // Handle Zod validation errors
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Invalid request data" },
                { status: 400 },
            )
        }

        return NextResponse.json(
            { error: "Failed to create assignment" },
            { status: 500 },
        )
    }
}
