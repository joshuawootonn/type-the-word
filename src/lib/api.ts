import { ParsedPassage } from './parseEsv'
import { PassageSegment } from './passageSegment'
import { TypingSession } from '~/server/repositories/typingSession.repository'
import { AddTypedVerseBody } from '~/app/api/typing-session/[id]/route'
import { ChapterHistory } from '~/app/api/chapter-history/[passage]/route'

export type Body<T> = { data: T }

export async function fetchPassage(
    value: PassageSegment,
): Promise<ParsedPassage> {
    const response = await fetch(`http://localhost:3000/api/passage/${value}`)

    const body: Body<ParsedPassage> = await response.json()

    return body.data
}

export async function fetchTypingSessionUpsert(): Promise<TypingSession> {
    const response = await fetch(`http://localhost:3000/api/typing-session`)

    const body: Body<TypingSession> = await response.json()

    return body.data
}

export async function fetchChapterHistory(
    value: PassageSegment,
): Promise<ChapterHistory> {
    const response = await fetch(
        `http://localhost:3000/api/chapter-history/${value}`,
    )

    const body: Body<ChapterHistory> = await response.json()

    return body.data
}

export async function fetchAddVerseToTypingSession(
    //todo: make this a UUID
    typingSessionId: string,
    verse: AddTypedVerseBody,
): Promise<TypingSession> {
    const response = await fetch(
        `http://localhost:3000/api/typing-session/${typingSessionId}`,
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
