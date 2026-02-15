"use client"

import {
    coursesResponseSchema,
    createAssignmentRequestSchema,
    createAssignmentResponseSchema,
    errorResponseSchema,
    type CreateAssignmentRequest,
} from "~/app/api/classroom/schemas"

/**
 * Fetches the teacher's courses from Google Classroom
 */
export async function fetchCourses() {
    const response = await fetch("/api/classroom/courses")

    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }

    const data = await response.json()
    return coursesResponseSchema.parse(data)
}

/**
 * Creates a new assignment
 */
export async function createAssignment(data: CreateAssignmentRequest) {
    const response = await fetch("/api/classroom/assignments", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(createAssignmentRequestSchema.parse(data)),
    })

    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }

    const result = await response.json()
    return createAssignmentResponseSchema.parse(result)
}
