import { HistoryOverview } from './history-overview'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '~/server/auth'
import { getHistory } from './getHistory'
import { HistoryLogV2 } from './history-log-2'
import { cookies } from 'next/headers'
export const metadata: Metadata = {
    title: 'Type the Word - History',
    description: 'History of all the passages you have typed.',
}

export default async function History() {
    const session = await getServerSession(authOptions)
    const cookieStore = cookies()

    const timezoneOffset = parseInt(
        cookieStore.get('timezoneOffset')?.value ?? '0',
    )

    if (session == null) {
        redirect('/')
    }

    const { overview, log2 } = await getHistory(session.user.id, timezoneOffset)

    return (
        <>
            <h2>Overview</h2>
            {overview.length === 0 ? (
                <p>
                    Once you have typed more verses this section will include
                    details on what books of the bible you have typed through.
                </p>
            ) : (
                <HistoryOverview overview={overview} />
            )}
            <hr className="mx-0 w-full border-t-2 border-primary" />
            <h2>Log</h2>
            {log2.length === 0 ? (
                <p>
                    Once you have typed more verses this section will include
                    details on how often you have typed over the past few
                    months.
                </p>
            ) : (
                <HistoryLogV2 monthLogs={log2} />
            )}
        </>
    )
}
