import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { FeatureFlags } from '~/lib/feature-flags'
import { authOptions } from '~/server/auth'
import PostHogClient from '~/server/posthog'

import { getWpmData } from '../getHistory'
import { WPMChart } from '../wpm-chart'

export const metadata: Metadata = {
    title: 'Type the Word - WPM & Accuracy',
    description: 'Your typing speed and accuracy over time.',
}

export default async function HistoryWpmPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        return null
    }

    // Check if user has access to WPM chart
    const showWpmChart = await PostHogClient().isFeatureEnabled(
        FeatureFlags.WPM_ACCURACY_CHART,
        session.user.id,
    )

    // Redirect to overview if feature is disabled
    if (!showWpmChart) {
        redirect('/history')
    }

    const cookieStore = await cookies()
    const timezoneOffset = parseInt(
        cookieStore.get('timezoneOffset')?.value ?? '0',
    )

    const wpmData = await getWpmData(session.user.id, timezoneOffset)

    return <WPMChart chartData={wpmData} />
}
