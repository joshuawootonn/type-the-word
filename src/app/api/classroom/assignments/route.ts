import { getServerSession } from "next-auth"
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
        // Set time to end of day (11:59 PM) for all assignments
        let dueDateObj: { year: number; month: number; day: number } | undefined
        let dueTimeObj: { hours: number; minutes: number } | undefined

        if (data.dueDate) {
            // Parse date (format: "YYYY-MM-DD")
            const [year, month, day] = data.dueDate.split("-").map(Number)
            dueDateObj = {
                year: year!,
                month: month!,
                day: day!,
            }
            // Set to 11:59 PM (end of day)
            dueTimeObj = {
                hours: 23,
                minutes: 59,
            }
        }

        // Create CourseWork in Google Classroom first
        const courseWork = await createCourseWork(accessToken, data.courseId, {
            title: data.title,
            description:
                data.description || `Type ${passageRef} (${data.translation})`,
            workType: "ASSIGNMENT",
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

        // Create assignment record in our database
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
            maxPoints: data.maxPoints,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
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
