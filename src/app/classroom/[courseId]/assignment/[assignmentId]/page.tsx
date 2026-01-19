import { getServerSession } from "next-auth"
import Link from "next/link"

import { authOptions } from "~/server/auth"
import {
    listCourses,
    refreshAccessToken,
} from "~/server/clients/classroom.client"
import {
    getAssignment,
    getTeacherToken,
    updateTeacherTokenAccess,
} from "~/server/repositories/classroom.repository"

import { ClientPage } from "./client-page"

interface PageProps {
    params: Promise<{ courseId: string; assignmentId: string }>
}

export default async function AssignmentDetailPage({ params }: PageProps) {
    const session = await getServerSession(authOptions)
    const { courseId, assignmentId } = await params

    if (!session?.user) {
        return (
            <div>
                <h1>Assignment Details</h1>
                <p>Please sign in to view assignment details.</p>
                <Link
                    href={`/auth/login?callbackUrl=%2Fclassroom%2F${encodeURIComponent(courseId)}%2Fassignment%2F${encodeURIComponent(assignmentId)}`}
                    className="svg-outline relative border-2 border-primary px-3 py-1 font-semibold no-underline"
                >
                    Log in
                </Link>
            </div>
        )
    }

    const tokenRecord = await getTeacherToken(session.user.id)

    if (!tokenRecord) {
        return (
            <div>
                <h1>Assignment Details</h1>
                <div className="not-prose border-2 border-error bg-secondary p-6">
                    <p className="text-error">
                        Please connect your Google Classroom account first.
                    </p>
                    <Link
                        href="/classroom"
                        className="svg-outline relative mt-4 inline-block border-2 border-primary bg-secondary px-3 py-1 font-semibold no-underline"
                    >
                        Connect Google Classroom
                    </Link>
                </div>
            </div>
        )
    }

    // Verify assignment exists and teacher owns it
    const assignment = await getAssignment(assignmentId)

    if (!assignment || assignment.teacherUserId !== session.user.id) {
        return (
            <div>
                <h1>Assignment Not Found</h1>
                <p>
                    This assignment could not be found or you don't have access
                    to it.
                </p>
                <Link
                    href="/classroom/dashboard"
                    className="svg-outline relative border-2 border-primary px-3 py-1 font-semibold no-underline"
                >
                    Back to Dashboard
                </Link>
            </div>
        )
    }

    // Get fresh access token
    let accessToken = tokenRecord.accessToken
    const now = new Date()
    if (tokenRecord.expiresAt <= now) {
        const refreshed = await refreshAccessToken(tokenRecord.refreshToken)
        accessToken = refreshed.accessToken
        await updateTeacherTokenAccess(
            session.user.id,
            refreshed.accessToken,
            refreshed.expiresAt,
        )
    }

    // Fetch course info
    const courses = await listCourses(accessToken)
    const course = courses.find(c => c.id === courseId)

    return (
        <ClientPage
            assignmentId={assignmentId}
            courseId={courseId}
            courseName={course?.name || "Unknown Course"}
        />
    )
}
