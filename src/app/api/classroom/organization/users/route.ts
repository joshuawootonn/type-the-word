import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

import {
    organizationUsersResponseSchema,
    type OrganizationUsersResponse,
} from "~/app/api/classroom/schemas"
import { authOptions } from "~/server/auth"
import {
    getApprovedOrganizationForUser,
    isUserOrganizationAdmin,
    listOrganizationDirectoryUsers,
    listPendingTeacherMemberships,
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

    const isOrgAdmin = await isUserOrganizationAdmin({
        organizationId: organization.id,
        userId: session.user.id,
    })
    if (!isOrgAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [users, pendingMemberships] = await Promise.all([
        listOrganizationDirectoryUsers(organization.id),
        listPendingTeacherMemberships(organization.id),
    ])

    const response: OrganizationUsersResponse = {
        organizationId: organization.id,
        organizationDomain: organization.domain,
        users,
        pendingTeachers: pendingMemberships.map(membership => ({
            userId: membership.user.id,
            email: membership.user.email,
            name: membership.user.name ?? null,
        })),
    }

    return NextResponse.json(organizationUsersResponseSchema.parse(response))
}
