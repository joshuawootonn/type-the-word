import { getServerSession } from "next-auth"

import { ClassroomNotice } from "~/components/classroom-notice"
import { authOptions } from "~/server/auth"
import { getTeacherToken } from "~/server/classroom/classroom.repository"

import { ClientPage } from "./client-page"

export default async function ClassroomDashboardSettingsPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return (
            <ClassroomNotice
                title="Settings"
                variant="notice"
                message="Sign in to view classroom settings."
                linkHref="/auth/login?callbackUrl=%2Fclassroom%2Fdashboard%2Fsettings"
                linkLabel="Log in"
            />
        )
    }

    const teacherToken = await getTeacherToken(session.user.id).catch(
        () => null,
    )
    if (!teacherToken) {
        return (
            <ClassroomNotice
                title="Settings"
                variant="error"
                message="Connect your teacher Google Classroom account to continue."
                linkHref="/classroom"
                linkLabel="Connect Teacher Account"
            />
        )
    }

    return <ClientPage />
}
