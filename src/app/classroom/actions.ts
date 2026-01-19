"use client"

import {
    authResponseSchema,
    disconnectResponseSchema,
    errorResponseSchema,
} from "~/app/api/classroom/schemas"

/**
 * Client-side actions for classroom connection management
 */

export async function initiateOAuthConnection(): Promise<string> {
    const response = await fetch("/api/classroom/auth")

    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }

    const data = await response.json()
    const validated = authResponseSchema.parse(data)
    return validated.authUrl
}

export async function initiateStudentOAuthConnection(): Promise<string> {
    const response = await fetch("/api/classroom/student-auth")

    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }

    const data = await response.json()
    const validated = authResponseSchema.parse(data)
    return validated.authUrl
}

export async function disconnectClassroom(): Promise<void> {
    const response = await fetch("/api/classroom/disconnect", {
        method: "POST",
    })

    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }

    const data = await response.json()
    disconnectResponseSchema.parse(data)
}

export async function disconnectStudentClassroom(): Promise<void> {
    const response = await fetch("/api/classroom/student-disconnect", {
        method: "POST",
    })

    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }

    const data = await response.json()
    disconnectResponseSchema.parse(data)
}
