import { getServerSession } from "next-auth"

import { ClientPage } from "~/app/(classroom)/classroom/client-page"
import { authOptions } from "~/server/auth"
import {
    getStudentToken,
    getTeacherToken,
} from "~/server/repositories/classroom.repository"
import { getApprovedOrganizationForUser } from "~/server/repositories/organization.repository"

interface PageProps {
    searchParams: Promise<{
        success?: string
        error?: string
        pending_teacher?: string
        student_success?: string
        student_error?: string
    }>
}

export default async function ClassroomPage({ searchParams }: PageProps) {
    const session = await getServerSession(authOptions)
    const params = await searchParams

    const isAuthed = session?.user != null
    const userId = session?.user.id

    const token = userId ? await getTeacherToken(userId) : null
    const approvedOrganization = userId
        ? await getApprovedOrganizationForUser(userId)
        : null
    const isConnected = !!token && approvedOrganization != null
    const studentToken = userId ? await getStudentToken(userId) : null
    const isStudentConnected = !!studentToken

    const hasSuccess = params.success === "true"
    const isTeacherPendingApproval = params.pending_teacher === "true"
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
            initialTeacherPendingApproval={isTeacherPendingApproval}
            initialError={errorMessage}
            initialStudentConnected={isStudentConnected || hasStudentSuccess}
            initialStudentSuccess={hasStudentSuccess}
            initialStudentError={studentErrorMessage}
            isInitiallyAuthed={isAuthed}
        />
    )
}
