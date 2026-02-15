"use client"

import { useSession } from "next-auth/react"
import posthog from "posthog-js"
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react"
import { useEffect } from "react"

import { env } from "~/env.mjs"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
            api_host: "/ingest",
            ui_host: "https://us.posthog.com",
            defaults: "2025-05-24",
            capture_exceptions: true,
            debug: process.env.NODE_ENV === "development",
        })
    }, [])

    return <PHProvider client={posthog}>{children}</PHProvider>
}

function getClassroomRole({
    hasClassroomTeacherAccess,
    hasClassroomStudentAccess,
}: {
    hasClassroomTeacherAccess: boolean
    hasClassroomStudentAccess: boolean
}) {
    if (hasClassroomTeacherAccess && hasClassroomStudentAccess) {
        return "teacher_and_student"
    }
    if (hasClassroomTeacherAccess) {
        return "teacher"
    }
    if (hasClassroomStudentAccess) {
        return "student"
    }

    return "none"
}

export function PostHogIdentify({
    hasClassroomTeacherAccess,
    hasClassroomStudentAccess,
}: {
    hasClassroomTeacherAccess: boolean
    hasClassroomStudentAccess: boolean
}) {
    const { data: session, status } = useSession()
    const posthog = usePostHog()

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            const classroomRole = getClassroomRole({
                hasClassroomTeacherAccess,
                hasClassroomStudentAccess,
            })
            posthog.identify(session.user.id, {
                email: session.user.email,
                name: session.user.name,
                has_classroom_teacher_access: hasClassroomTeacherAccess,
                has_classroom_student_access: hasClassroomStudentAccess,
                classroom_role: classroomRole,
            })
        } else if (status === "unauthenticated") {
            posthog.reset()
        }
    }, [
        hasClassroomStudentAccess,
        hasClassroomTeacherAccess,
        session,
        status,
        posthog,
    ])

    return null
}
