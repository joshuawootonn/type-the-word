import { getServerSession } from "next-auth"

import { ClassroomNotice } from "~/components/classroom-notice"
import { Link } from "~/components/ui/link"
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
            <ClassroomNotice
                title="Assignment Details"
                variant="error"
                message="Please connect your Google Classroom account first."
                linkHref="/classroom"
                linkLabel="Connect Google Classroom"
            />
        )
    }

    // Verify assignment exists and teacher owns it
    const assignment = await getAssignment(assignmentId)

    if (!assignment || assignment.teacherUserId !== session.user.id) {
        return (
            <ClassroomNotice
                title="Assignment Not Found"
                variant="error"
                message="This assignment could not be found or you don't have access to it."
                linkHref="/classroom/dashboard"
                linkLabel="Back to Dashboard"
            />
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
