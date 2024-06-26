import { HistoryOverview } from './history-overview'
import { Metadata } from 'next'
import { HistoryLog } from './history-log'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '~/server/auth'
import { getHistory } from './getHistory'
export const metadata: Metadata = {
    title: 'Type the Word - History',
    description: 'History of all the passages you have typed.',
}

export default async function History() {
    const session = await getServerSession(authOptions)

    if (session == null) {
        redirect('/')
    }

    const { overview, log } = await getHistory(session.user.id)

    return (
        <>
            <h2>Overview</h2>
            <HistoryOverview overview={overview} />
            <hr className="mx-0 w-full border-t-2 border-black dark:border-white" />
            <h2>Log</h2>
            <HistoryLog log={log} />
        </>
    )
}
