import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { authOptions } from '~/server/auth'
import PostHogClient from '~/server/posthog'

import { getHistory } from './getHistory'
import { HistoryTabs } from './history-tabs'

export const metadata: Metadata = {
    title: 'Type the Word - History',
    description: 'History of all the passages you have typed.',
}

type TabValue = 'overview' | 'wpm' | 'log'

function isValidTab(value: string | undefined): value is TabValue {
    return value === 'overview' || value === 'wpm' || value === 'log'
}

export default async function History() {
    const session = await getServerSession(authOptions)
    const cookieStore = cookies()

    const timezoneOffset = parseInt(
        cookieStore.get('timezoneOffset')?.value ?? '0',
    )
    const historyTabCookie = cookieStore.get('historyTab')?.value
    const initialTab: TabValue = isValidTab(historyTabCookie)
        ? historyTabCookie
        : 'overview'

    if (session == null) {
        redirect('/')
    }

    // Check feature flags first
    const [useOptimizedHistory, showWpmChart] = await Promise.all([
        PostHogClient().isFeatureEnabled(
            'use-read-optimized-history',
            session.user.id,
        ),
        PostHogClient().isFeatureEnabled(
            'use-wpm-accuracy-history-chart',
            session.user.id,
        ),
    ])

    // Then fetch history using appropriate path based on flag
    const { overview, log2, allVerseStats } = await getHistory(
        session.user.id,
        timezoneOffset,
        useOptimizedHistory ?? false,
    )

    return (
        <HistoryTabs
            overview={overview}
            log2={log2}
            allVerseStats={allVerseStats}
            showWpmChart={showWpmChart ?? false}
            initialTab={initialTab}
            useOptimizedHistory={useOptimizedHistory ?? false}
        />
    )
}
