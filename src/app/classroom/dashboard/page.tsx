import { getServerSession } from "next-auth"

import { ClassroomNotice } from "~/components/classroom-notice"
import { authOptions } from "~/server/auth"
import { getTeacherToken } from "~/server/repositories/classroom.repository"

import { ClientPage } from "./client-page"

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        return (
            <ClassroomNotice
                title="Dashboard"
                variant="notice"
                message="Sign in to view your dashboard."
                linkHref="/auth/login?callbackUrl=%2Fclassroom%2Fdashboard"
                linkLabel="Log in"
            />
        )
    }

    const token = await getTeacherToken(session.user.id)

    if (!token) {
        return (
            <ClassroomNotice
                title="Dashboard"
                variant="error"
                message="Connect your Google Classroom teacher account to view the dashboard for your classes."
                linkHref="/classroom"
                linkLabel="Connect as a teacher"
            />
        )
    }

    return <ClientPage />
}
