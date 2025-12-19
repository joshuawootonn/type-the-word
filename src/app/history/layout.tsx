import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

import { FeatureFlags } from '~/lib/feature-flags'
import { authOptions } from '~/server/auth'
import PostHogClient from '~/server/posthog'

import { HistoryTabsNav } from './history-tabs-nav'

export default async function HistoryLayout({
    children,
}: {
    children: ReactNode
}) {
    const session = await getServerSession(authOptions)

    if (session == null) {
        redirect('/')
    }

    // Check feature flags
    const showWpmChart = await PostHogClient().isFeatureEnabled(
        FeatureFlags.WPM_ACCURACY_CHART,
        session.user.id,
    )

    return (
        <main className="prose mx-auto mb-8 w-full flex-grow pt-4 text-lg text-primary dark:prose-invert prose-headings:text-primary prose-p:text-primary lg:pt-8">
            <h1 className="">History</h1>
            <HistoryTabsNav showWpmChart={showWpmChart ?? false} />
            {children}
        </main>
    )
}
