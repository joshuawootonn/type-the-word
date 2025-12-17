import { getServerSession } from 'next-auth'

import { authOptions } from '~/server/auth'

import { getOverviewData } from '../getHistory'
import { HistoryOverview } from '../history-overview'

export async function OverviewTabContent({
    useOptimizedHistory,
}: {
    useOptimizedHistory: boolean
}) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return null
    }

    const overview = await getOverviewData(session.user.id, useOptimizedHistory)

    if (overview.length === 0) {
        return (
            <p>
                Once you have typed more verses this section will include
                details on what books of the bible you have typed through.
            </p>
        )
    }

    return <HistoryOverview overview={overview} />
}
