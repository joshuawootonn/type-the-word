"use client"

import {
    errorResponseSchema,
    organizationSettingsSchema,
    updateOrganizationSettingsRequestSchema,
} from "~/app/api/classroom/schemas"

export async function fetchOrganizationSettings() {
    const response = await fetch("/api/classroom/organization/settings")
    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }

    const data = await response.json()
    return organizationSettingsSchema.parse(data)
}

export async function saveOrganizationSettings(input: {
    accuracyThreshold: number
    regularAccuracyThreshold: number
}) {
    const body = updateOrganizationSettingsRequestSchema.parse(input)

    const response = await fetch("/api/classroom/organization/settings", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    })
    if (!response.ok) {
        const errorData = await response.json()
        const error = errorResponseSchema.parse(errorData)
        throw new Error(error.error)
    }

    const data = await response.json()
    return organizationSettingsSchema.parse(data)
}
