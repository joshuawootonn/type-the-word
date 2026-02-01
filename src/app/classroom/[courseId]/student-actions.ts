"use client"

import {
    studentAssignmentsResponseSchema,
    errorResponseSchema,
} from "~/app/api/classroom/schemas"

/**
 * Fetches student's assignments for a course with personal progress
 */
export async function fetchStudentAssignments(courseId: string) {
    const response = await fetch(
        `/api/classroom/student/assignments?courseId=${encodeURIComponent(courseId)}`,
    )

    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }

    const data = await response.json()
    return studentAssignmentsResponseSchema.parse(data)
}
