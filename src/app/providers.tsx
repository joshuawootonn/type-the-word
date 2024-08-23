'use client'

import { ThemeProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

const queryClient = new QueryClient()

export function Providers({
    session,
    children,
}: {
    children: ReactNode
    session: Session | null
}) {
    return (
        <ThemeProvider themes={['light', 'dark']} attribute="class">
            <QueryClientProvider client={queryClient}>
                <SessionProvider session={session}>{children}</SessionProvider>
            </QueryClientProvider>
        </ThemeProvider>
    )
}
