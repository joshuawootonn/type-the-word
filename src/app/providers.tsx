'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { BuiltinThemeRecord } from '~/server/repositories/builtinTheme.repository'
import { ThemeProvider } from './theme-provider'
import { UserThemeRecord } from '~/server/repositories/userTheme.repository'
import { CurrentTheme } from '~/server/repositories/currentTheme.repository'
import { useSoliDeoGloria } from '~/components/use-soli-deo-gloria'
import { useTimezoneOffsetCookie } from '~/components/use-time-zone-offset-cookie'
import { PostHogProvider } from './PostHogProvider'

const queryClient = new QueryClient()

export function Providers({
    session,
    children,
    builtinThemes,
    userThemes,
    currentTheme,
}: {
    children: ReactNode
    session: Session | null
    builtinThemes: BuiltinThemeRecord[]
    userThemes: UserThemeRecord[]
    currentTheme: CurrentTheme | null
}) {
    useTimezoneOffsetCookie()
    useSoliDeoGloria()

    return (
        <PostHogProvider>
            <QueryClientProvider client={queryClient}>
                <SessionProvider session={session}>
                    <ThemeProvider
                        session={session}
                        builtinThemes={builtinThemes}
                        userThemes={userThemes}
                        currentTheme={currentTheme}
                    >
                        {children}
                    </ThemeProvider>
                </SessionProvider>
            </QueryClientProvider>
        </PostHogProvider>
    )
}
