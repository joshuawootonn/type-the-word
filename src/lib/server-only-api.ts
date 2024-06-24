import { cookies } from 'next/headers'
import { TypingSessionLog } from '~/app/api/history/log'
import { BookOverview } from '~/app/api/history/overview'

export type Body<T> = { data: T }

export async function fetchHistory(): Promise<{
    log: TypingSessionLog[]
    overview: BookOverview[]
}> {
    const response = await fetch(`http://localhost:3000/api/history`, {
        headers: { Cookie: cookies().toString() },
    })

    const body: Body<{
        log: TypingSessionLog[]
        overview: BookOverview[]
    }> = await response.json()

    return body.data
}
