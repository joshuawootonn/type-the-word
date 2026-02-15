"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"

import { ClassroomCookieSync } from "~/components/classroom-cookie-sync"
import { useSoliDeoGloria } from "~/components/use-soli-deo-gloria"
import { useTimezoneOffsetCookie } from "~/components/use-time-zone-offset-cookie"
import { BuiltinThemeRecord } from "~/server/repositories/builtinTheme.repository"
import { CurrentTheme } from "~/server/repositories/currentTheme.repository"
import { UserThemeRecord } from "~/server/repositories/userTheme.repository"

import { PostHogProvider, PostHogIdentify } from "./PostHogProvider"
import { ThemeProvider } from "./theme-provider"

const queryClient = new QueryClient()

export function Providers({
    session,
    children,
    builtinThemes,
    userThemes,
    currentTheme,
    hasClassroomTeacherAccess,
    hasClassroomStudentAccess,
}: {
    children: ReactNode
    session: Session | null
    builtinThemes: BuiltinThemeRecord[]
    userThemes: UserThemeRecord[]
    currentTheme: CurrentTheme | null
    hasClassroomTeacherAccess: boolean
    hasClassroomStudentAccess: boolean
}) {
    useTimezoneOffsetCookie()
    useSoliDeoGloria()

    return (
        <PostHogProvider>
            <QueryClientProvider client={queryClient}>
                <SessionProvider session={session}>
                    <PostHogIdentify
                        hasClassroomTeacherAccess={hasClassroomTeacherAccess}
                        hasClassroomStudentAccess={hasClassroomStudentAccess}
                    />
                    <ThemeProvider
                        session={session}
                        builtinThemes={builtinThemes}
                        userThemes={userThemes}
                        currentTheme={currentTheme}
                    >
                        {children}
                    </ThemeProvider>
                    <ClassroomCookieSync />
                </SessionProvider>
            </QueryClientProvider>
        </PostHogProvider>
    )
}
