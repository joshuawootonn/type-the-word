import { z } from 'zod'

import { ChapterHistory } from '~/app/api/chapter-history/[passage]/route'
import { AddTypedVerseBody } from '~/app/api/typing-session/[id]/route'
import {
    BuiltinThemeRecord,
    ThemeRecord,
} from '~/server/repositories/builtinTheme.repository'
import { CurrentTheme } from '~/server/repositories/currentTheme.repository'
import {
    TypedVerse,
    TypingSession,
} from '~/server/repositories/typingSession.repository'
import { UserChangelogRecord } from '~/server/repositories/userChangelog.repository'
import { UserThemeRecord } from '~/server/repositories/userTheme.repository'

import { ParsedPassage, Translation } from './parseEsv'
import { PassageSegment } from './passageSegment'

export type Body<T> = { data: T }

export function getBaseUrl() {
    if (typeof window !== 'undefined') return ''

    if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
        return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`

    return `http://localhost:${process.env.PORT ?? 1199}`
}

export async function fetchPassage(
    value: PassageSegment,
    translation: Translation = 'esv',
): Promise<ParsedPassage> {
    const params = new URLSearchParams()
    if (translation !== 'esv') {
        params.set('translation', translation)
    }
    const queryString = params.toString()
    const url = `${getBaseUrl()}/api/passage/${value}${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url)

    const body: unknown = await response.json()

    if (!response.ok) {
        const errorBody = body as { error?: string }
        throw new Error(
            errorBody?.error ?? `Failed to fetch passage: ${response.status}`,
        )
    }

    const typedBody = body as Body<ParsedPassage>
    if (!typedBody.data) {
        throw new Error('Passage data is undefined')
    }

    return typedBody.data
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
    translation: Translation = 'esv',
): Promise<ChapterHistory> {
    const params = new URLSearchParams()
    if (translation !== 'esv') {
        params.set('translation', translation)
    }
    const queryString = params.toString()
    const url = `${getBaseUrl()}/api/chapter-history/${value}${queryString ? `?${queryString}` : ''}`

    const response = await fetch(url, { cache: 'no-store' })

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

export async function fetchUserChangelog(): Promise<UserChangelogClientSchema | null> {
    const response = await fetch(`${getBaseUrl()}/api/user-changelog`, {
        headers: {
            'Content-Type': 'application/json',
        },
    })

    const body: Body<UserChangelogRecord | null> = await response.json()

    if (!response.ok) {
        const errorBody = body as { error?: string }
        throw new Error(
            errorBody?.error ??
                `Failed to fetch user changelog: ${response.status}`,
        )
    }

    if (body.data == null) {
        return null
    }

    return userChangelogClientSchema.parse(body.data)
}

export async function fetchBuiltinThemes(): Promise<BuiltinThemeRecord[]> {
    const response = await fetch(`${getBaseUrl()}/api/builtin-theme`, {
        headers: {
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        return []
    }

    const body: Body<BuiltinThemeRecord[]> = await response.json()

    return body.data
}

export async function fetchUserThemes(): Promise<UserThemeRecord[]> {
    const response = await fetch(`${getBaseUrl()}/api/user-theme`, {
        headers: {
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        return []
    }

    const body: Body<UserThemeRecord[]> = await response.json()

    return body.data
}

export async function fetchCurrentTheme(): Promise<CurrentTheme | null> {
    const response = await fetch(`${getBaseUrl()}/api/current-theme`, {
        headers: {
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        return null
    }

    const body: Body<CurrentTheme> = await response.json()

    return body.data
}

export async function fetchSetCurrentTheme(
    theme: Omit<CurrentTheme, 'userId'>,
): Promise<CurrentTheme> {
    const response = await fetch(`${getBaseUrl()}/api/current-theme`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(theme),
    })

    const body: Body<CurrentTheme> = await response.json()

    return body.data
}

export async function fetchCreateTheme(
    theme: Omit<ThemeRecord, 'id'>,
): Promise<UserThemeRecord> {
    const response = await fetch(`${getBaseUrl()}/api/user-theme`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(theme),
    })

    const body: Body<UserThemeRecord> = await response.json()

    return body.data
}

export async function fetchDeleteTheme(id: string): Promise<null> {
    await fetch(`${getBaseUrl()}/api/user-theme/${id}`, {
        method: 'DELETE',
    })

    return null
}
