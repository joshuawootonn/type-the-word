'use client'

import { ThemeProvider as NextThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { BuiltinThemeRecord } from '~/server/repositories/builtinTheme.repository'
import { ThemeProvider } from './theme-provider'

const queryClient = new QueryClient()

export function Providers({
    session,
    children,
    builtinThemes,
}: {
    children: ReactNode
    session: Session | null
    builtinThemes: BuiltinThemeRecord[]
}) {
    return (
        <NextThemeProvider themes={['light', 'dark']} attribute="class">
            <QueryClientProvider client={queryClient}>
                <SessionProvider session={session}>
                    <ThemeProvider
                        session={session}
                        builtinThemes={builtinThemes}
                    >
                        {children}
                    </ThemeProvider>
                </SessionProvider>
            </QueryClientProvider>
        </NextThemeProvider>
    )
}
