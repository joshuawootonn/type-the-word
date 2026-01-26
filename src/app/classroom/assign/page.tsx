import { getServerSession } from "next-auth"

import { ClassroomNotice } from "~/components/classroom-notice"
import { Link } from "~/components/ui/link"
import { authOptions } from "~/server/auth"
import { getTeacherToken } from "~/server/repositories/classroom.repository"

import { ClientPage } from "./client-page"

interface PageProps {
    searchParams: Promise<{ courseId?: string }>
}

export default async function AssignPage({ searchParams }: PageProps) {
    const session = await getServerSession(authOptions)
    const params = await searchParams

    // If not authenticated, redirect to login
    if (!session?.user) {
        return (
            <div>
                <h1>Create Assignment</h1>
                <p>Please sign in to create assignments.</p>
                <Link href="/auth/login?callbackUrl=%2Fclassroom%2Fassign">
                    Log in
                </Link>
            </div>
        )
    }

    // Check if user has connected Google Classroom
    const token = await getTeacherToken(session.user.id)

    if (!token) {
        return (
            <ClassroomNotice
                title="Create Assignment"
                variant="error"
                message="Connect your Google Classroom teacher account to create assignments for your classes."
                linkHref="/classroom"
                linkLabel="Connect as a teacher"
            />
        )
    }

    return <ClientPage initialCourseId={params.courseId} />
}
