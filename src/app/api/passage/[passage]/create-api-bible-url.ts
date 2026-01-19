import { bookToApiBibleId } from "~/lib/api-bible-book-id"
import { API_BIBLE_IDS } from "~/lib/api-bible-ids"
import { PassageObject } from "~/lib/passageObject"

/**
 * Creates a URL for fetching a passage from API.Bible
 * @see https://rest.api.bible/
 */
export function createApiBibleURL(
    passageData: PassageObject,
    translation: keyof typeof API_BIBLE_IDS,
): string {
    const bibleId = API_BIBLE_IDS[translation]

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
        "content-type": "html",
        "include-notes": "false",
        "include-titles": "true",
        "include-chapter-numbers": "false",
        "include-verse-numbers": "true",
        "include-verse-spans": "true",
        "use-org-id": "false",
    })

    return `https://rest.api.bible/v1/bibles/${bibleId}/passages/${passageId}?${params.toString()}`
}
