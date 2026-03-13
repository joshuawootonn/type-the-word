"use client"

import { useQuery } from "@tanstack/react-query"
import { createContext, ReactNode, useContext, useMemo } from "react"

import {
    errorResponseSchema,
    organizationSettingsSchema,
} from "~/app/api/classroom/schemas"

type OrganizationSettingsContextValue = {
    accuracyThreshold: number
    regularAccuracyThreshold: number
    isLoading: boolean
    error: string | null
}

const defaultValue: OrganizationSettingsContextValue = {
    accuracyThreshold: 90,
    regularAccuracyThreshold: 30,
    isLoading: false,
    error: null,
}

const OrganizationSettingsContext =
    createContext<OrganizationSettingsContextValue>(defaultValue)

export function OrganizationSettingsProvider({
    children,
}: {
    children: ReactNode
}) {
    const settingsQuery = useQuery({
        queryKey: ["classroom-organization-settings"],
        queryFn: async () => {
            const response = await fetch("/api/classroom/organization/settings")
            if (!response.ok) {
                const errorData = await response.json()
                const error = errorResponseSchema.parse(errorData)
                throw new Error(error.error)
            }

            const data = await response.json()
            return organizationSettingsSchema.parse(data)
        },
    })

    const value = useMemo<OrganizationSettingsContextValue>(() => {
        if (settingsQuery.data) {
            return {
                accuracyThreshold: settingsQuery.data.accuracyThreshold,
                regularAccuracyThreshold:
                    settingsQuery.data.regularAccuracyThreshold,
                isLoading: settingsQuery.isLoading,
                error:
                    settingsQuery.error instanceof Error
                        ? settingsQuery.error.message
                        : null,
            }
        }

        return {
            ...defaultValue,
            isLoading: settingsQuery.isLoading,
            error:
                settingsQuery.error instanceof Error
                    ? settingsQuery.error.message
                    : null,
        }
    }, [settingsQuery.data, settingsQuery.error, settingsQuery.isLoading])

    return (
        <OrganizationSettingsContext.Provider value={value}>
            {children}
        </OrganizationSettingsContext.Provider>
    )
}

export function useOrganizationSettings(): OrganizationSettingsContextValue {
    return useContext(OrganizationSettingsContext)
}
