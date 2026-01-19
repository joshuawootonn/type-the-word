import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

import { authOptions } from "~/server/auth"
import { getStudentAuthUrl } from "~/server/clients/classroom.client"

import { type AuthResponse } from "../schemas"

/**
 * Initiates the OAuth flow for Google Classroom (student)
 * GET /api/classroom/student-auth
 */
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const authUrl = getStudentAuthUrl(session.user.id)

        const response: AuthResponse = { authUrl }
        return NextResponse.json(response)
    } catch (error) {
        console.error("Error generating student auth URL:", error)
        return NextResponse.json(
            { error: "Failed to generate auth URL" },
            { status: 500 },
        )
    }
}
