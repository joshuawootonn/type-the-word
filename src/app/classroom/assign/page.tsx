import { getServerSession } from "next-auth"
import Link from "next/link"

import { authOptions } from "~/server/auth"
import { getTeacherToken } from "~/server/repositories/classroom.repository"

import { ClientPage } from "./client-page"

export default async function AssignPage() {
    const session = await getServerSession(authOptions)

    // If not authenticated, redirect to login
    if (!session?.user) {
        return (
            <div>
                <h1>Create Assignment</h1>
                <p>Please sign in to create assignments.</p>
                <Link
                    href="/auth/login?callbackUrl=%2Fclassroom%2Fassign"
                    className="svg-outline relative border-2 border-primary px-3 py-1 font-semibold no-underline"
                >
                    Log in
                </Link>
            </div>
        )
    }

    // Check if user has connected Google Classroom
    const token = await getTeacherToken(session.user.id)

    if (!token) {
        return (
            <div>
                <h1>Create Assignment</h1>
                <div className="not-prose border-2 border-error bg-secondary p-6">
                    <p className="mb-4 text-error">
                        Please connect your Google Classroom account before
                        creating assignments.
                    </p>
                    <Link
                        href="/classroom"
                        className="svg-outline relative border-2 border-primary bg-secondary px-3 py-1 font-semibold no-underline"
                    >
                        Connect Google Classroom
                    </Link>
                </div>
            </div>
        )
    }

    return <ClientPage />
}
