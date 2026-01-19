import { getServerSession } from "next-auth"

import { Link } from "~/components/ui/link"
import { authOptions } from "~/server/auth"
import { getTeacherToken } from "~/server/repositories/classroom.repository"

import { ClientPage } from "./client-page"

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return (
            <div>
                <h1>Dashboard</h1>
                <p>Please sign in to view your dashboard.</p>
                <Link href="/auth/login?callbackUrl=%2Fclassroom%2Fdashboard">
                    Log in
                </Link>
            </div>
        )
    }

    const token = await getTeacherToken(session.user.id)

    if (!token) {
        return (
            <div>
                <h1>Dashboard</h1>
                <div className="not-prose border-2 border-error bg-secondary p-6">
                    <p className="text-error">
                        Please connect your Google Classroom account first.
                    </p>
                    <Link href="/classroom">Connect Google Classroom</Link>
                </div>
            </div>
        )
    }

    return <ClientPage />
}
