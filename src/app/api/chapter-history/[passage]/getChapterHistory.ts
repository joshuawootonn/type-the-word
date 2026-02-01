import { typingSessionToString } from "~/app/history/typingSessionToString"
import { Translation } from "~/lib/parseEsv"
import { PassageObject } from "~/lib/passageObject"
import { getBibleMetadata } from "~/server/bibleMetadata"
import { db } from "~/server/db"
import { TypedVerseRepository } from "~/server/repositories/typedVerse.repository"
import { TypedVerse } from "~/server/repositories/typingSession.repository"

import { ChapterHistory } from "./route"

export async function getChapterHistory(
    userId: string,
    passageObject: PassageObject,
    translation: Translation,
): Promise<ChapterHistory> {
    const typedVerseRepository = new TypedVerseRepository(db)

    const typedVerses = await typedVerseRepository.getMany({
        userId,
        book: passageObject.book,
        chapter: passageObject.chapter,
        translation,
        omitTypingData: true,
    })

    const bibleMetadata = getBibleMetadata()
    const numberOfVersesInChapterBookCombo =
        bibleMetadata[passageObject.book]?.chapters?.[passageObject.chapter - 1]
            ?.length

    if (numberOfVersesInChapterBookCombo == null) {
        throw new Error(
            `Failed to find the number of verses for ${passageObject.book} ${passageObject.chapter}`,
        )
    }

    let verses: ChapterHistory["verses"] = {}

    const chronologicalVerses = typedVerses.slice().reverse()
    for (const verse of chronologicalVerses) {
        verses[verse.verse] = true

        if (Object.values(verses).length >= numberOfVersesInChapterBookCombo) {
            verses = {}
        }
    }

    const versesBySession = new Map<string, TypedVerse[]>()
    for (const verse of typedVerses) {
        const sessionVerses = versesBySession.get(verse.typingSessionId) ?? []
        sessionVerses.push(verse)
        versesBySession.set(verse.typingSessionId, sessionVerses)
    }

    const sessionCreatedDates = new Map<string, Date>()
    for (const verse of typedVerses) {
        if (!sessionCreatedDates.has(verse.typingSessionId)) {
            sessionCreatedDates.set(verse.typingSessionId, verse.createdAt)
        } else {
            const existingDate = sessionCreatedDates.get(verse.typingSessionId)!
            if (verse.createdAt < existingDate) {
                sessionCreatedDates.set(verse.typingSessionId, verse.createdAt)
            }
        }
    }

    const chapterLogs = Array.from(versesBySession.entries())
        .map(([sessionId, verses]) => ({
            location: typingSessionToString(verses, {
                seperator: "\n",
            }).split("\n"),
            createdAt: sessionCreatedDates.get(sessionId)!,
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return { verses, chapterLogs }
}
