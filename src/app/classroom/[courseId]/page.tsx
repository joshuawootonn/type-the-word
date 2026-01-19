import { getServerSession } from "next-auth"
import Link from "next/link"

import { authOptions } from "~/server/auth"
import { listCourses } from "~/server/clients/classroom.client"
import { refreshAccessToken } from "~/server/clients/classroom.client"
import {
    getTeacherToken,
    updateTeacherTokenAccess,
} from "~/server/repositories/classroom.repository"

import { ClientPage } from "./client-page"

interface PageProps {
    params: Promise<{ courseId: string }>
}

export default async function CoursePage({ params }: PageProps) {
    const session = await getServerSession(authOptions)
    const { courseId } = await params

    if (!session?.user) {
        return (
            <div>
                <h1>Dashboard</h1>
                <p>Please sign in to view your dashboard.</p>
                <Link
                    href={`/auth/login?callbackUrl=%2Fclassroom%2F${encodeURIComponent(courseId)}`}
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
                <h1>Dashboard</h1>
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

    // Fetch course info from Google
    const courses = await listCourses(accessToken)
    const course = courses.find(c => c.id === courseId)

    if (!course) {
        return (
            <div>
                <h1>Course Not Found</h1>
                <p>
                    This course could not be found or you don't have access to
                    it.
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

    return <ClientPage courseId={courseId} courseName={course.name} />
}
