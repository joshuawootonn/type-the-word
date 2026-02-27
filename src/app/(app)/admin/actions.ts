"use client"

import {
    adminErrorResponseSchema,
    deactivateUserResponseSchema,
    type DeactivateUserResponse,
} from "~/app/api/admin/users/deactivate/schemas"
import {
    adminUserSearchResponseSchema,
    type AdminUserSearchResponse,
} from "~/app/api/admin/users/search/schemas"

export async function deactivateUser(
    userId: string,
): Promise<DeactivateUserResponse> {
    const response = await fetch("/api/admin/users/deactivate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
    })

    const data: unknown = await response.json()

    if (!response.ok) {
        const parsedError = adminErrorResponseSchema.safeParse(data)
        throw new Error(
            parsedError.success
                ? parsedError.data.error
                : "Failed to deactivate user",
        )
    }

    return deactivateUserResponseSchema.parse(data)
}

export async function searchUsers(
    query: string,
): Promise<AdminUserSearchResponse> {
    const trimmedQuery = query.trim()
    if (trimmedQuery.length < 2) {
        return { users: [] }
    }

    const response = await fetch(
        `/api/admin/users/search?q=${encodeURIComponent(trimmedQuery)}`,
    )

    const data: unknown = await response.json()

    if (!response.ok) {
        const parsedError = adminErrorResponseSchema.safeParse(data)
        throw new Error(
            parsedError.success
                ? parsedError.data.error
                : "Failed to search users",
        )
    }

    return adminUserSearchResponseSchema.parse(data)
}
