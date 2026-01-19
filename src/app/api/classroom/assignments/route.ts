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
import {
    createCourseWork,
    refreshAccessToken,
} from "~/server/clients/classroom.client"
import { type Book, type Translation } from "~/server/db/schema"
import {
    createAssignment,
    getTeacherToken,
    updateTeacherTokenAccess,
} from "~/server/repositories/classroom.repository"

import {
    createAssignmentRequestSchema,
    type CreateAssignmentResponse,
} from "../schemas"

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
        const rangeValidation = validatePassageRange({
            book: data.book as Book,
            startChapter: data.startChapter,
            startVerse: data.startVerse,
            endChapter: data.endChapter,
            endVerse: data.endVerse,
        })

        if (!rangeValidation.valid) {
            return NextResponse.json(
                { error: rangeValidation.error ?? "Invalid passage range" },
                { status: 400 },
            )
        }

        // Calculate total verses in range
        const totalVerses = countVersesInRange({
            book: data.book as Book,
            startChapter: data.startChapter,
            startVerse: data.startVerse,
            endChapter: data.endChapter,
            endVerse: data.endVerse,
        })

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

        // Build passage reference for title/description
        const passageRef = `${data.book} ${data.startChapter}:${data.startVerse}-${data.endChapter}:${data.endVerse}`

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

        // Create CourseWork in Google Classroom as DRAFT
        const courseWork = await createCourseWork(accessToken, data.courseId, {
            title: data.title,
            description:
                data.description || `Type ${passageRef} (${data.translation})`,
            workType: "ASSIGNMENT",
            state: "DRAFT",
            maxPoints: data.maxPoints,
            dueDate: dueDateObj,
            dueTime: dueTimeObj,
            materials: [
                {
                    link: {
                        url: `${env.DEPLOYED_URL}/classroom/assignment/pending`,
                        title: "Start Assignment",
                    },
                },
            ],
        })

        // Create assignment record in our database as DRAFT
        const assignment = await createAssignment({
            teacherUserId: session.user.id,
            courseId: data.courseId,
            courseWorkId: courseWork.id,
            title: data.title,
            description: data.description,
            translation: data.translation as Translation,
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

        // TODO: Update the CourseWork link to point to the actual assignment
        // For now, we'll return the assignment ID so the frontend can construct the link

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
