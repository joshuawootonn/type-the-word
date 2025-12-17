import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'

import { authOptions } from '~/server/auth'

import { getWpmData } from '../getHistory'
import { WPMChart } from '../wpm-chart'

export async function WpmTabContent() {
    const session = await getServerSession(authOptions)

    if (!session) {
        return null
    }

    const cookieStore = cookies()
    const timezoneOffset = parseInt(
        cookieStore.get('timezoneOffset')?.value ?? '0',
    )

    const wpmData = await getWpmData(session.user.id, timezoneOffset)

    return <WPMChart allStats={wpmData} />
}
