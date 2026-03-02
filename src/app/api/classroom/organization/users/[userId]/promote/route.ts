import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import {
    getApprovedOrganizationForUser,
    isUserOrganizationAdmin,
    promoteTeacherToAdmin,
} from "~/server/repositories/organization.repository"

export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ userId: string }> },
) {
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

    const isOrgAdmin = await isUserOrganizationAdmin({
        organizationId: organization.id,
        userId: session.user.id,
    })
    if (!isOrgAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { userId } = await params

    try {
        await promoteTeacherToAdmin({
            organizationId: organization.id,
            teacherUserId: userId,
            promotedByUserId: session.user.id,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to promote teacher",
            },
            { status: 400 },
        )
    }
}
