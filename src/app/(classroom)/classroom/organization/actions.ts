"use client"

import {
    errorResponseSchema,
    organizationUsersResponseSchema,
} from "~/app/api/classroom/schemas"

export async function fetchOrganizationUsers() {
    const response = await fetch("/api/classroom/organization/users")
    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }

    const data = await response.json()
    return organizationUsersResponseSchema.parse(data)
}

export async function approveOrganizationTeacher(userId: string) {
    const response = await fetch(
        `/api/classroom/organization/users/${encodeURIComponent(userId)}/approve`,
        {
            method: "POST",
        },
    )
    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }
}
