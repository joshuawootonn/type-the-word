import { getServerSession } from "next-auth"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import { deleteStudentToken } from "~/server/repositories/classroom.repository"

import { type DisconnectResponse } from "../schemas"

/**
 * Disconnect student Google Classroom account
 * POST /api/classroom/student-disconnect
 */
export async function POST() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        await deleteStudentToken(session.user.id)

        // Delete student cookie
        const cookieStore = await cookies()
        cookieStore.delete("classroomStudent")

        const response: DisconnectResponse = { success: true }
        return NextResponse.json(response)
    } catch (error) {
        console.error("Error disconnecting student account:", error)
        return NextResponse.json(
            { error: "Failed to disconnect" },
            { status: 500 },
        )
    }
}
