import { getServerSession } from "next-auth"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import { deleteTeacherToken } from "~/server/classroom/classroom.repository"
import {
    getApprovedOrganizationForUser,
    hasAnotherApprovedOrganizationAdmin,
    isUserOrganizationAdmin,
} from "~/server/repositories/organization.repository"

import { type DisconnectResponse } from "../schemas"

/**
 * Disconnect Google Classroom account
 * POST /api/classroom/disconnect
 */
export async function POST() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const approvedOrganization = await getApprovedOrganizationForUser(
            session.user.id,
        )
        if (approvedOrganization) {
            const isOrgAdmin = await isUserOrganizationAdmin({
                organizationId: approvedOrganization.id,
                userId: session.user.id,
            })

            if (isOrgAdmin) {
                const hasAnotherAdmin =
                    await hasAnotherApprovedOrganizationAdmin({
                        organizationId: approvedOrganization.id,
                        excludingUserId: session.user.id,
                    })

                if (!hasAnotherAdmin) {
                    return NextResponse.json(
                        {
                            error: "You are the only organization admin. Promote another teacher to admin before disconnecting.",
                        },
                        { status: 403 },
                    )
                }
            }
        }

        await deleteTeacherToken(session.user.id)

        // Delete teacher cookie
        const cookieStore = await cookies()
        cookieStore.delete("classroomTeacher")

        const response: DisconnectResponse = { success: true }
        return NextResponse.json(response)
    } catch (error) {
        console.error("Error disconnecting classroom:", error)
        return NextResponse.json(
            { error: "Failed to disconnect" },
            { status: 500 },
        )
    }
}
