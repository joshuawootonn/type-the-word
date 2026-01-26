"use client"

import {
    dashboardResponseSchema,
    errorResponseSchema,
} from "~/app/api/classroom/schemas"

/**
 * Fetches assignments for a specific course and status
 */
export async function fetchCourseAssignments({
    courseId,
    status,
    startingAfter = 0,
    limit = 5,
}: {
    courseId: string
    status: "current" | "draft" | "archived"
    startingAfter?: number
    limit?: number
}) {
    const params = new URLSearchParams({
        courseId,
        status,
        startingAfter: String(startingAfter),
        limit: String(limit),
    })

    const response = await fetch(`/api/classroom/dashboard?${params}`)

    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }

    const data = await response.json()
    return dashboardResponseSchema.parse(data)
}

/**
 * Publishes a draft assignment
 */
export async function publishAssignment(assignmentId: string) {
    const response = await fetch(
        `/api/classroom/assignments/${assignmentId}/publish`,
        {
            method: "POST",
        },
    )

    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }

    return await response.json()
}
