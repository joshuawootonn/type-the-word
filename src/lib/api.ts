import { ParsedPassage } from './parseEsv'
import { PassageSegment } from './passageSegment'
import {
    TypedVerse,
    TypingSession,
} from '~/server/repositories/typingSession.repository'
import { AddTypedVerseBody } from '~/app/api/typing-session/[id]/route'
import { ChapterHistory } from '~/app/api/chapter-history/[passage]/route'
import { UserChangelogRecord } from '~/server/repositories/userChangelog.repository'
import { z } from 'zod'

export type Body<T> = { data: T }

export function getBaseUrl() {
    if (typeof window !== 'undefined') return ''

    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`

    return `http://localhost:${process.env.PORT ?? 3000}`
}

export async function fetchPassage(
    value: PassageSegment,
): Promise<ParsedPassage> {
    const response = await fetch(`${getBaseUrl()}/api/passage/${value}`)

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

export async function fetchLastVerse(): Promise<TypedVerse> {
    const response = await fetch(`${getBaseUrl()}/api/last-verse`, {
        headers: {
            'Content-Type': 'application/json',
        },
    })

    const body: Body<TypedVerse> = await response.json()

    return body.data
}

const userChangelogClientSchema = z.object({ lastVisitedAt: z.string() })
export type UserChangelogClientSchema = z.infer<
    typeof userChangelogClientSchema
>

export async function fetchUserChangelog(): Promise<UserChangelogClientSchema> {
    const response = await fetch(`${getBaseUrl()}/api/user-changelog`, {
        headers: {
            'Content-Type': 'application/json',
        },
    })

    const body: Body<UserChangelogRecord> = await response.json()

    return userChangelogClientSchema.parse(body.data)
}
