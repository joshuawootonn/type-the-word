"use client"

import {
    assignmentDetailSchema,
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
