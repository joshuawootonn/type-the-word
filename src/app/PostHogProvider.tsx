'use client'

import { useSession } from 'next-auth/react'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'

import { env } from '~/env.mjs'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
            api_host: '/ingest',
            ui_host: 'https://us.posthog.com',
            defaults: '2025-05-24',
            capture_exceptions: true,
            debug: process.env.NODE_ENV === 'development',
        })
    }, [])

    return <PHProvider client={posthog}>{children}</PHProvider>
}

export function PostHogIdentify() {
    const { data: session, status } = useSession()
    const posthog = usePostHog()

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            posthog.identify(session.user.id, {
                email: session.user.email,
                name: session.user.name,
            })
        } else if (status === 'unauthenticated') {
            posthog.reset()
        }
    }, [session, status, posthog])

    return null
}
