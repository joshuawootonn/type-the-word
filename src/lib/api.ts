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
import {
    CurrentTheme,
    CurrentThemeRecord,
} from '~/server/repositories/currentTheme.repository'
import {
    BuiltinThemeRecord,
    ThemeRecord,
} from '~/server/repositories/builtinTheme.repository'
import { UserThemeRecord } from '~/server/repositories/userTheme.repository'

export type Body<T> = { data: T }

export function getBaseUrl() {
    if (typeof window !== 'undefined') return ''

    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`

    return `http://localhost:${process.env.PORT ?? 3010}`
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
