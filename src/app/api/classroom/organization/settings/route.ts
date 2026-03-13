import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import {
    organizationSettingsSchema,
    updateOrganizationSettingsRequestSchema,
    type OrganizationSettings,
} from "~/app/api/classroom/schemas"
import { authOptions } from "~/server/auth"
import {
    getApprovedOrganizationForUser,
    getOrganizationSettingsByOrganizationIdOrThrow,
    isUserApprovedOrganizationTeacher,
    updateOrganizationSettings,
} from "~/server/repositories/organization.repository"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organization = await getApprovedOrganizationForUser(session.user.id)
    if (!organization) {
        return NextResponse.json(
            { error: "No approved organization membership" },
            { status: 403 },
        )
    }

    const isOrgTeacher = await isUserApprovedOrganizationTeacher({
        organizationId: organization.id,
        userId: session.user.id,
    })
    const settings = await getOrganizationSettingsByOrganizationIdOrThrow({
        organizationId: organization.id,
    })

    const response: OrganizationSettings = {
        organizationId: organization.id,
        accuracyThreshold: settings.accuracyThreshold,
        regularAccuracyThreshold: settings.regularAccuracyThreshold,
        isOrgTeacher,
    }

    return NextResponse.json(organizationSettingsSchema.parse(response))
}

export async function PUT(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organization = await getApprovedOrganizationForUser(session.user.id)
    if (!organization) {
        return NextResponse.json(
            { error: "No approved organization membership" },
            { status: 403 },
        )
    }

    const isOrgTeacher = await isUserApprovedOrganizationTeacher({
        organizationId: organization.id,
        userId: session.user.id,
    })
    if (!isOrgTeacher) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
        const body = await request.json()
        const validated = updateOrganizationSettingsRequestSchema.parse(body)
        const settings = await updateOrganizationSettings({
            organizationId: organization.id,
            accuracyThreshold: validated.accuracyThreshold,
            regularAccuracyThreshold: validated.regularAccuracyThreshold,
        })

        const response: OrganizationSettings = {
            organizationId: organization.id,
            accuracyThreshold: settings.accuracyThreshold,
            regularAccuracyThreshold: settings.regularAccuracyThreshold,
            isOrgTeacher: true,
        }
        return NextResponse.json(organizationSettingsSchema.parse(response))
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to update organization settings",
            },
            { status: 400 },
        )
    }
}
