"use client"

import {
    assignmentMutationResponseSchema,
    assignmentDetailSchema,
    assignmentSyncResponseSchema,
    errorResponseSchema,
} from "~/app/api/classroom/schemas"

/**
 * Fetches assignment details with student progress
 */
export async function fetchAssignmentDetail(assignmentId: string) {
    const response = await fetch(`/api/classroom/assignments/${assignmentId}`)

    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }

    const data = await response.json()
    return assignmentDetailSchema.parse(data)
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
    return data
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
