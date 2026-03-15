"use client"

import {
    assignmentMutationResponseSchema,
    assignmentSyncResponseSchema,
    assignmentsResponseSchema,
    errorResponseSchema,
} from "~/app/api/classroom/schemas"

/**
 * Fetches assignments for a course with pagination
 * Works for both teachers and students
 */
export async function fetchAssignments({
    courseId,
    page = 0,
    limit = 10,
}: {
    courseId: string
    page?: number
    limit?: number
}) {
    const params = new URLSearchParams({
        courseId,
        page: String(page),
        limit: String(limit),
    })

    const response = await fetch(`/api/classroom/assignments?${params}`)

    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }

    const data = await response.json()
    return assignmentsResponseSchema.parse(data)
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

    const data = await response.json()
    return assignmentMutationResponseSchema.parse(data)
}

/**
 * Manually syncs an assignment with Google Classroom
 */
export async function syncAssignment(assignmentId: string) {
    const response = await fetch(
        `/api/classroom/assignments/${assignmentId}/sync`,
        {
            method: "POST",
        },
    )

    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }

    const data = await response.json()
    return assignmentSyncResponseSchema.parse(data)
}

/**
 * Deletes an assignment
 */
export async function deleteAssignment(assignmentId: string) {
    const response = await fetch(`/api/classroom/assignments/${assignmentId}`, {
        method: "DELETE",
    })

    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }

    const data = await response.json()
    return assignmentMutationResponseSchema.parse(data)
}
