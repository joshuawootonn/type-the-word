import { cookies } from 'next/headers'
import { TypingSessionLog } from '~/app/api/history/log'
import { BookOverview } from '~/app/api/history/overview'
import { Body, getBaseUrl } from './api'

export async function fetchHistory(): Promise<{
    log: TypingSessionLog[]
    overview: BookOverview[]
}> {
    const response = await fetch(`${getBaseUrl()}/api/history`, {
        headers: { Cookie: cookies().toString() },
    })

    const body: Body<{
        log: TypingSessionLog[]
        overview: BookOverview[]
    }> = await response.json()

    if (!response.ok) console.error(body)

    return body.data
}
