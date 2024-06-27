import { fetchHistory } from '~/lib/server-only-api'
import { HistoryOverview } from './history-overview'
import { Metadata } from 'next'
import { HistoryLog } from './history-log'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '~/server/auth'

export const metadata: Metadata = {
    title: 'Type the Word - History',
    description: 'History of all the passages you have typed.',
}

export default async function History() {
    const session = await getServerSession(authOptions)

    if (session == null) {
        redirect('/')
    }

    const history = await fetchHistory()

    return (
        <>
            <h2>Overview</h2>
            <HistoryOverview overview={history.overview} />
            <hr className="mx-0 w-full border-t-2 border-black dark:border-white" />
            <h2>Log</h2>
            <HistoryLog log={history.log} />
        </>
    )
}
