import { getServerSession } from "next-auth"

import { ClientPage } from "~/app/(classroom)/classroom/dashboard/client-page"
import { ClassroomNotice } from "~/components/classroom-notice"
import { authOptions } from "~/server/auth"
import {
    getTeacherToken,
    getStudentToken,
} from "~/server/repositories/classroom.repository"

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

    const teacherToken = await getTeacherToken(session.user.id).catch(
        () => null,
    )
    const studentToken = await getStudentToken(session.user.id).catch(
        () => null,
    )

    if (!teacherToken && !studentToken) {
        return (
            <ClassroomNotice
                title="Dashboard"
                variant="error"
                message="Connect your Google Classroom account to view your dashboard."
                linkHref="/classroom"
                linkLabel="Connect to Google Classroom"
            />
        )
    }

    return <ClientPage />
}
