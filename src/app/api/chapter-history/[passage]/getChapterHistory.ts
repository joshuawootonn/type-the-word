import { TypingSessionRepository } from '~/server/repositories/typingSession.repository'
import { ChapterHistory } from './route'
import { PassageObject } from '~/lib/passageObject'
import { db } from '~/server/db'

export async function getChapterHistory(
    userId: string,
    passageObject: PassageObject,
): Promise<ChapterHistory> {
    const typingSessionRepository = new TypingSessionRepository(db)

    const typingSessions = await typingSessionRepository.getMany({
        userId,
    })

    const verses: ChapterHistory['verses'] = {}

    for (const session of typingSessions) {
        for (const verse of session.typedVerses) {
            if (
                verse.book !== passageObject.book ||
                verse.chapter !== passageObject.chapter
            ) {
                continue
            }

            const acc = verses[verse.verse] ?? []
            verses[verse.verse] = [...acc, verse]
        }
    }

    return { verses }
}
