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
                <p>Sign in to view your dashboard.</p>
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
                <p className="text-error">
                    Connect yourGoogle Classroom teacher account to view the
                    dashboard for your classes.
                </p>
                <Link href="/classroom">Connect as a teacher</Link>
            </div>
        )
    }

    return <ClientPage />
}
