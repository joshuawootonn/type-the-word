'use client'

import { ThemeProvider } from './theme-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import {
    CurrentThemeRecord,
    ThemeRecord,
} from '~/server/repositories/theme.repository'

const queryClient = new QueryClient()

export function Providers({
    session,
    children,
    themes,
    currentTheme,
}: {
    children: ReactNode
    session: Session | null
    themes: ThemeRecord[]
    currentTheme: CurrentThemeRecord | null
}) {
    return (
        <>
            <QueryClientProvider client={queryClient}>
                <SessionProvider session={session}>
                    <ThemeProvider
                        session={session}
                        themes={themes}
                        currentTheme={currentTheme}
                    >
                        {children}
                    </ThemeProvider>
                </SessionProvider>
            </QueryClientProvider>
        </>
    )
}
