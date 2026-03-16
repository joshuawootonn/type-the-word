import { PassageObject } from "~/lib/passageObject"
import { Translation } from "~/server/db/schema"

export type PassageResponseCacheKey = {
    translation: Translation
    book: PassageObject["book"]
    chapter: number
    firstVerse: number
    lastVerse: number
}

export function toPassageResponseCacheKey(
    passageData: PassageObject,
    translation: Translation,
): PassageResponseCacheKey {
    if (passageData.lastVerse != null) {
        const firstVerse = passageData.firstVerse ?? passageData.lastVerse
        return {
            translation,
            book: passageData.book,
            chapter: passageData.chapter,
            firstVerse,
            lastVerse: passageData.lastVerse,
        }
    }

    // Use 0/0 as the canonical chapter cache key.
    return {
        translation,
        book: passageData.book,
        chapter: passageData.chapter,
        firstVerse: 0,
        lastVerse: 0,
    }
}
