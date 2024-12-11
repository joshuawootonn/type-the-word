'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { BuiltinThemeRecord } from '~/server/repositories/builtinTheme.repository'
import { ThemeProvider } from './theme-provider'
import { UserThemeRecord } from '~/server/repositories/userTheme.repository'
import { CurrentTheme } from '~/server/repositories/currentTheme.repository'

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
    return (
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
    )
}
