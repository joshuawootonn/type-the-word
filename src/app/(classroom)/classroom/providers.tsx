"use client"

import { ReactNode } from "react"

import { OrganizationSettingsProvider } from "~/app/(classroom)/classroom/organization-settings-context"

export function ClassroomProviders({ children }: { children: ReactNode }) {
    return (
        <OrganizationSettingsProvider>{children}</OrganizationSettingsProvider>
    )
}
