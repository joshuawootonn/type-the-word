import { bookToApiBibleId } from '~/lib/api-bible-book-id'
import { Translation } from '~/lib/parseEsv'
import { PassageObject } from '~/lib/passageObject'

// API.Bible IDs for each translation
export const API_BIBLE_IDS: Partial<Record<Translation, string>> = {
    bsb: 'bba9f40183526463-01', // Berean Standard Bible
    nlt: 'd6e14a625393b4da-01', // New Living Translation
    niv: '78a9f6124f344018-01', // New International Version 2011
    csb: 'a556c5305ee15c3f-01', // Christian Standard Bible
    nkjv: '63097d2a0a2f7db3-01', // New King James Version
    nasb: 'a761ca71e0b3ddcf-01', // New American Standard Bible 2020
    ntv: '826f63861180e056-01', // Nueva Traducción Viviente
    msg: '6f11a7de016f942e-01', // The Message
}

/**
 * Creates a URL for fetching a passage from API.Bible
 * @see https://rest.api.bible/
 */
export function createApiBibleURL(
    passageData: PassageObject,
    translation: Translation,
): string {
    const bibleId = API_BIBLE_IDS[translation]
    if (!bibleId) {
        throw new Error(
            `No API.Bible ID configured for translation: ${translation}`,
        )
    }

    const bookId = bookToApiBibleId[passageData.book]

    // Build the passage ID in API.Bible format
    // For whole chapters: GEN.1
    // For verse ranges: GEN.1.1-GEN.1.5
    // For single verse: GEN.1.1
    let passageId: string

    if (passageData.firstVerse != null && passageData.lastVerse != null) {
        if (passageData.firstVerse === passageData.lastVerse) {
            // Single verse
            passageId = `${bookId}.${passageData.chapter}.${passageData.firstVerse}`
        } else {
            // Verse range
            passageId = `${bookId}.${passageData.chapter}.${passageData.firstVerse}-${bookId}.${passageData.chapter}.${passageData.lastVerse}`
        }
    } else {
        // Whole chapter
        passageId = `${bookId}.${passageData.chapter}`
    }

    const params = new URLSearchParams({
        'content-type': 'html',
        'include-notes': 'false',
        'include-titles': 'true',
        'include-chapter-numbers': 'false',
        'include-verse-numbers': 'true',
        'include-verse-spans': 'true',
        'use-org-id': 'false',
    })

    return `https://rest.api.bible/v1/bibles/${bibleId}/passages/${passageId}?${params.toString()}`
}
