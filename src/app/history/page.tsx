import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { Loading } from '~/components/loading'
import { authOptions } from '~/server/auth'
import PostHogClient from '~/server/posthog'

import { HistoryTabs } from './history-tabs'
import { LogTabContent } from './tab-content/log-tab-content'
import { OverviewTabContent } from './tab-content/overview-tab-content'
import { WpmTabContent } from './tab-content/wpm-tab-content'

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

    const historyTabCookie = cookieStore.get('historyTab')?.value
    const initialTab: TabValue = isValidTab(historyTabCookie)
        ? historyTabCookie
        : 'overview'

    if (session == null) {
        redirect('/')
    }

    // Check feature flags
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

    return (
        <HistoryTabs
            showWpmChart={showWpmChart ?? false}
            initialTab={initialTab}
            useOptimizedHistory={useOptimizedHistory ?? false}
            overviewContent={
                <Suspense fallback={<Loading />}>
                    <OverviewTabContent
                        useOptimizedHistory={useOptimizedHistory ?? false}
                    />
                </Suspense>
            }
            logContent={
                <Suspense fallback={<Loading initialDots={2} />}>
                    <LogTabContent />
                </Suspense>
            }
            wpmContent={
                <Suspense fallback={<Loading initialDots={3} />}>
                    <WpmTabContent />
                </Suspense>
            }
        />
    )
}
