import { getServerSession } from "next-auth"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import { deleteTeacherToken } from "~/server/repositories/classroom.repository"

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
