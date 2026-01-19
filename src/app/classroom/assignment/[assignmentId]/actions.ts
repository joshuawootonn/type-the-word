"use client"

import {
    errorResponseSchema,
    turnInAssignmentResponseSchema,
} from "~/app/api/classroom/schemas"

export async function turnInAssignment(
    assignmentId: string,
): Promise<{ success: boolean }> {
    const response = await fetch(
        `/api/classroom/assignments/${assignmentId}/turn-in`,
        {
            method: "POST",
        },
    )
    const body: unknown = await response.json()

    if (!response.ok) {
        const errorBody = errorResponseSchema.safeParse(body)
        if (errorBody.success) {
            throw new Error(errorBody.data.error)
        }
        throw new Error("Failed to turn in assignment.")
    }

    return turnInAssignmentResponseSchema.parse(body)
}
