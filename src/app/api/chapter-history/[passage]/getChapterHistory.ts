import { typingSessionToString } from "~/app/history/typingSessionToString"
import { Translation } from "~/lib/parseEsv"
import { PassageObject } from "~/lib/passageObject"
import { getBibleMetadata } from "~/server/bibleMetadata"
import { db } from "~/server/db"
import { TypingSessionRepository } from "~/server/repositories/typingSession.repository"

import { ChapterHistory } from "./route"

export async function getChapterHistory(
    userId: string,
    passageObject: PassageObject,
    translation: Translation,
): Promise<ChapterHistory> {
    const typingSessionRepository = new TypingSessionRepository(db)

    const typingSessions = await typingSessionRepository.getMany({
        userId,
        book: passageObject.book,
        chapter: passageObject.chapter,
        translation,
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

    const chronologicalTypingSession = typingSessions.slice().reverse()
    for (const session of chronologicalTypingSession) {
        for (const verse of session.typedVerses) {
            if (
                verse.book !== passageObject.book ||
                verse.chapter !== passageObject.chapter ||
                verse.translation !== translation
            ) {
                continue
            }

            verses[verse.verse] = true

            if (
                Object.values(verses).length >= numberOfVersesInChapterBookCombo
            ) {
                verses = {}
            }
        }
    }

    const chapterLogs = typingSessions.map(typingSession => ({
        location: typingSessionToString(
            typingSession.typedVerses.filter(
                typedVerse =>
                    typedVerse.chapter === passageObject.chapter &&
                    typedVerse.book === passageObject.book &&
                    typedVerse.translation === translation,
            ),
            {
                seperator: "\n",
            },
        ).split("\n"),
        createdAt: typingSession.createdAt,
    }))

    return { verses, chapterLogs }
}
