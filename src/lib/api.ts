import { ParsedPassage } from './parseEsv'
import { PassageSegment } from './passageSegment'
import { TypingSession } from '~/server/repositories/typingSession.repository'
import { AddTypedVerseBody } from '~/app/api/typing-session/[id]/route'
import { ChapterHistory } from '~/app/api/chapter-history/[passage]/route'

export type Body<T> = { data: T }

export function getBaseUrl() {
    if (typeof window !== 'undefined') return ''
    if (process.env.VERCEL_URL)
        return process.env.VERCEL_ENV === 'production'
            ? 'https://typetheword.site'
            : `https://${process.env.VERCEL_URL}`
    return `http://localhost:${process.env.PORT ?? 3000}`
}

export async function fetchPassage(
    value: PassageSegment,
): Promise<ParsedPassage> {
    const url = `${getBaseUrl()}/api/passage/${value}`
    console.log({
        baseUrl: getBaseUrl(),
        url,
        VERCEL_URL: process.env.VERCEL_URL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        PORT: process.env.PORT,
    })

    const response = await fetch(url)

    const body: Body<ParsedPassage> = await response.json()

    return body.data
}

export async function fetchTypingSessionUpsert(): Promise<TypingSession> {
    const response = await fetch(`${getBaseUrl()}/api/typing-session`, {
        cache: 'no-store',
    })

    const body: Body<TypingSession> = await response.json()

    return body.data
}

export async function fetchChapterHistory(
    value: PassageSegment,
): Promise<ChapterHistory> {
    const response = await fetch(
        `${getBaseUrl()}/api/chapter-history/${value}`,
        { cache: 'no-store' },
    )

    const body: Body<ChapterHistory> = await response.json()

    return body.data
}

export async function fetchAddVerseToTypingSession(
    typingSessionId: string,
    verse: AddTypedVerseBody,
): Promise<TypingSession> {
    const response = await fetch(
        `${getBaseUrl()}/api/typing-session/${typingSessionId}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(verse),
        },
    )

    const body: Body<TypingSession> = await response.json()

    return body.data
}
