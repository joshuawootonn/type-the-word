import { getServerSession } from "next-auth"

import { authOptions } from "~/server/auth"
import {
    getStudentToken,
    getTeacherToken,
} from "~/server/repositories/classroom.repository"

import { ClientPage } from "./client-page"

interface PageProps {
    searchParams: Promise<{
        success?: string
        error?: string
        student_success?: string
        student_error?: string
    }>
}

export default async function ClassroomPage({ searchParams }: PageProps) {
    const session = await getServerSession(authOptions)
    const params = await searchParams

    const isAuthed = session?.user != null
    const userId = session?.user.id

    // Check if user has already connected their account
    const token = userId ? await getTeacherToken(userId) : null
    const isConnected = !!token
    const studentToken = userId ? await getStudentToken(userId) : null
    const isStudentConnected = !!studentToken

    // Check for OAuth callback params
    const hasSuccess = params.success === "true"
    const errorMessage = params.error
        ? `Connection failed: ${params.error}`
        : null
    const hasStudentSuccess = params.student_success === "true"
    const studentErrorMessage = params.student_error
        ? `Student connection failed: ${params.student_error}`
        : null

    return (
        <ClientPage
            initialIsConnected={isConnected || hasSuccess}
            initialSuccess={hasSuccess}
            initialError={errorMessage}
            initialStudentConnected={isStudentConnected || hasStudentSuccess}
            initialStudentSuccess={hasStudentSuccess}
            initialStudentError={studentErrorMessage}
            isInitiallyAuthed={isAuthed}
        />
    )
}
