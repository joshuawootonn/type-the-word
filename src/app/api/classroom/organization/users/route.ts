import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

import {
    organizationUsersResponseSchema,
    type OrganizationUsersResponse,
} from "~/app/api/classroom/schemas"
import { authOptions } from "~/server/auth"
import {
    getApprovedOrganizationMembership,
    getApprovedOrganizationForUser,
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

    const membership = await getApprovedOrganizationMembership({
        organizationId: organization.id,
        userId: session.user.id,
    })
    const isOrgAdmin = membership?.role === "ORG_ADMIN"
    const isTeacher = membership?.role === "TEACHER"
    if (!isOrgAdmin && !isTeacher) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [users, pendingMemberships] = await Promise.all([
        listOrganizationDirectoryUsers(organization.id),
        listPendingTeacherMemberships(organization.id),
    ])

    const response: OrganizationUsersResponse = {
        organizationId: organization.id,
        organizationDomain: organization.domain,
        isOrgAdmin,
        users,
        pendingTeachers: pendingMemberships.map(membership => ({
            userId: membership.user.id,
            email: membership.user.email,
            name: membership.user.name ?? null,
        })),
    }

    return NextResponse.json(organizationUsersResponseSchema.parse(response))
}
