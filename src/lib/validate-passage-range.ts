import { getBibleMetadata, Translation } from "~/server/bibleMetadata"
import { type Book } from "~/server/db/schema"

export interface PassageRange {
    book: Book
    startChapter: number
    startVerse: number
    endChapter: number
    endVerse: number
}

export interface ValidationResult {
    valid: boolean
    error?: string
}

/**
 * Validates that a passage range is valid:
 * - End comes after start
 * - Chapters exist in the book
 * - Verses exist in the chapters
 */
export async function validatePassageRange(
    range: PassageRange,
    translation: Translation,
): Promise<ValidationResult> {
    const metadata = await getBibleMetadata(translation)
    const bookMetadata = metadata[range.book]

    if (!bookMetadata) {
        return {
            valid: false,
            error: `Book "${range.book}" not found`,
        }
    }

    // Check if start chapter exists
    if (
        range.startChapter < 1 ||
        range.startChapter > bookMetadata.chapters.length
    ) {
        return {
            valid: false,
            error: `Start chapter ${range.startChapter} does not exist in ${bookMetadata.name}`,
        }
    }

    // Check if end chapter exists
    if (
        range.endChapter < 1 ||
        range.endChapter > bookMetadata.chapters.length
    ) {
        return {
            valid: false,
            error: `End chapter ${range.endChapter} does not exist in ${bookMetadata.name}`,
        }
    }

    // Get verse counts for chapters
    const startChapterVerseCount =
        bookMetadata.chapters[range.startChapter - 1]?.length
    const endChapterVerseCount =
        bookMetadata.chapters[range.endChapter - 1]?.length

    if (startChapterVerseCount === undefined) {
        return {
            valid: false,
            error: `Could not get verse count for chapter ${range.startChapter}`,
        }
    }

    if (endChapterVerseCount === undefined) {
        return {
            valid: false,
            error: `Could not get verse count for chapter ${range.endChapter}`,
        }
    }

    // Check if start verse exists
    if (range.startVerse < 1 || range.startVerse > startChapterVerseCount) {
        return {
            valid: false,
            error: `Start verse ${range.startVerse} does not exist in ${bookMetadata.name} ${range.startChapter}`,
        }
    }

    // Check if end verse exists
    if (range.endVerse < 1 || range.endVerse > endChapterVerseCount) {
        return {
            valid: false,
            error: `End verse ${range.endVerse} does not exist in ${bookMetadata.name} ${range.endChapter}`,
        }
    }

    // Check if end comes after start
    if (range.endChapter < range.startChapter) {
        return {
            valid: false,
            error: `End chapter ${range.endChapter} must be after or equal to start chapter ${range.startChapter}`,
        }
    }

    if (
        range.endChapter === range.startChapter &&
        range.endVerse < range.startVerse
    ) {
        return {
            valid: false,
            error: `End verse ${range.endVerse} must be after or equal to start verse ${range.startVerse}`,
        }
    }

    return { valid: true }
}

/**
 * Calculates the total number of verses in a passage range
 */
export async function countVersesInRange(
    range: PassageRange,
    translation: Translation,
): Promise<number> {
    const metadata = await getBibleMetadata(translation)
    const bookMetadata = metadata[range.book]

    if (!bookMetadata) {
        return 0
    }

    let count = 0

    // Same chapter
    if (range.startChapter === range.endChapter) {
        return range.endVerse - range.startVerse + 1
    }

    // First chapter (from startVerse to end of chapter)
    const firstChapterVerseCount =
        bookMetadata.chapters[range.startChapter - 1]?.length ?? 0
    count += firstChapterVerseCount - range.startVerse + 1

    // Middle chapters (all verses)
    for (let ch = range.startChapter + 1; ch < range.endChapter; ch++) {
        count += bookMetadata.chapters[ch - 1]?.length ?? 0
    }

    // Last chapter (from start of chapter to endVerse)
    count += range.endVerse

    return count
}
