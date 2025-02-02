import { ChapterHistory } from './route'
import { PassageObject } from '~/lib/passageObject'
import { getBibleMetadata } from '~/server/bibleMetadata'
import { db } from '~/server/db'
import { TypedVerseRepository } from '~/server/repositories/typedVerse.repository'
import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'
import { typingSessionToString } from '~/app/history/typingSessionToString'

export async function getChapterHistory(
    userId: string,
    passageObject: PassageObject,
): Promise<ChapterHistory> {
    const typedVerseRepository = new TypedVerseRepository(db)
    const typingSessionRepository = new TypingSessionRepository(db)

    const typingSessions = await typingSessionRepository.getMany({
        userId,
        book: passageObject.book,
        chapter: passageObject.chapter,
    })

    const typedVersesForPassage = await typedVerseRepository.getMany({
        userId,
        book: passageObject.book,
        chapter: passageObject.chapter,
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

    let verses: ChapterHistory['verses'] = {}

    for (const verse of typedVersesForPassage) {
        if (
            verse.book !== passageObject.book ||
            verse.chapter !== passageObject.chapter
        ) {
            continue
        }

        verses[verse.verse] = true

        if (Object.values(verses).length >= numberOfVersesInChapterBookCombo) {
            verses = {}
        }
    }

    const chapterLogs = typingSessions.map(typingSession => ({
        location: typingSessionToString(
            typingSession.typedVerses.filter(
                typedVerse =>
                    typedVerse.chapter === passageObject.chapter &&
                    typedVerse.book === passageObject.book,
            ),
            {
                seperator: '\n',
            },
        ).split('\n'),
        createdAt: typingSession.createdAt,
    }))

    return { verses, chapterLogs }
}
