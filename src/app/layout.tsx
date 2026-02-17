import { Analytics } from "@vercel/analytics/react"
import clsx from "clsx"
import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { cookies } from "next/headers"
import { type CSSProperties } from "react"

import { authOptions } from "~/server/auth"
import { db } from "~/server/db"
import { BuiltinThemeRepository } from "~/server/repositories/builtinTheme.repository"
import {
    CurrentTheme,
    CurrentThemeRepository,
} from "~/server/repositories/currentTheme.repository"
import {
    UserThemeRecord,
    UserThemeRepository,
} from "~/server/repositories/userTheme.repository"
import "~/styles/globals.css"

import Fathom from "./fathom"
import { poppins } from "./fonts"
import { GlobalHotkeys } from "./global-hotkeys"
import { Providers } from "./providers"
import { ThemeScript } from "./theme-script"
import { ThemeStyles } from "./theme-styles"

export const metadata: Metadata = {
    metadataBase: new URL("https://typetheword.site"),
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    let currentTheme: CurrentTheme | null = null
    let userThemes: UserThemeRecord[] = []

    const builtinThemeRepository = new BuiltinThemeRepository(db)
    const builtinThemes = await builtinThemeRepository.getMany()

    if (session != null) {
        const userThemeRepository = new UserThemeRepository(db)
        userThemes = await userThemeRepository.getMany({
            userId: session.user.id,
        })

        const currentThemeRepository = new CurrentThemeRepository(db)
        currentTheme = await currentThemeRepository.getCurrentTheme({
            userId: session.user.id,
        })
    }

    // Check if user has teacher Classroom token (via cookies)
    // Only teachers should see the dashboard navigation link
    const cookieStore = await cookies()
    const hasClassroomTeacherAccess = cookieStore.has("classroomTeacher")
    const hasClassroomStudentAccess = cookieStore.has("classroomStudent")
    const bodyStyle = {
        "--classroom-content-max-width": hasClassroomTeacherAccess
            ? "1000px"
            : "var(--container-page)",
    } as CSSProperties

    // added suppressHydrationWarning since `ThemeScript` adds classes to `html` onload
    return (
        <html lang="en" suppressHydrationWarning className={poppins.variable}>
            <head>
                <ThemeStyles
                    builtinThemes={builtinThemes}
                    userThemes={userThemes}
                />
                <ThemeScript
                    currentTheme={currentTheme}
                    builtinThemes={builtinThemes}
                    userThemes={userThemes}
                />
            </head>
            <body
                className={clsx("min-h-screen-1px flex w-full font-sans")}
                style={bodyStyle}
            >
                <Providers
                    currentTheme={currentTheme}
                    userThemes={userThemes}
                    builtinThemes={builtinThemes}
                    session={session}
                    hasClassroomTeacherAccess={hasClassroomTeacherAccess}
                    hasClassroomStudentAccess={hasClassroomStudentAccess}
                >
                    {children}
                </Providers>
                <Fathom />
                <Analytics />
                <GlobalHotkeys />
            </body>
        </html>
    )
}
