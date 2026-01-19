import { getServerSession } from "next-auth"

import { authOptions } from "~/server/auth"
import { getTeacherToken } from "~/server/repositories/classroom.repository"

import { ClientPage } from "./client-page"

interface PageProps {
    searchParams: Promise<{ success?: string; error?: string }>
}

export default async function ClassroomPage({ searchParams }: PageProps) {
    const session = await getServerSession(authOptions)
    const params = await searchParams

    const isAuthed = session?.user != null
    const userId = session?.user.id

    // Check if user has already connected their account
    const token = userId ? await getTeacherToken(userId) : null
    const isConnected = !!token

    // Check for OAuth callback params
    const hasSuccess = params.success === "true"
    const errorMessage = params.error
        ? `Connection failed: ${params.error}`
        : null

    return (
        <ClientPage
            initialIsConnected={isConnected || hasSuccess}
            initialSuccess={hasSuccess}
            initialError={errorMessage}
            isInitiallyAuthed={isAuthed}
        />
    )
}
