import { z } from "zod"

import { bookSchema } from "~/lib/types/book"

const bookMetadataSchema = z.object({
    chapters: z.array(z.object({ length: z.number() })),
    testament: z.enum(["OT", "NT"]),
    name: z.string(),
})

export type BookMetadata = z.infer<typeof bookMetadataSchema>

const bibleMetadataSchema = z.record(
    z.enum(bookSchema.options),
    bookMetadataSchema,
)
export type BibleMetadata = z.infer<typeof bibleMetadataSchema>

// Define Translation type based on the enum values from the database schema
export type Translation =
    | "esv"
    | "bsb"
    | "nlt"
    | "niv"
    | "csb"
    | "nkjv"
    | "nasb"
    | "ntv"
    | "msg"

// Cache for loaded metadata to avoid repeated imports
const metadataCache: Partial<Record<Translation, BibleMetadata>> = {}

/**
 * Gets Bible metadata for a specific translation.
 * Uses lazy dynamic imports to load translation-specific JSON files.
 * @param translation The Bible translation (esv, bsb, nlt, etc.)
 * @returns BibleMetadata object with verse counts per chapter
 */
export async function getBibleMetadata(
    translation: Translation,
): Promise<BibleMetadata> {
    // Return cached version if available
    if (metadataCache[translation]) {
        return metadataCache[translation]!
    }

    // Dynamically import the translation-specific metadata
    const metadataModule = await import(`./bible-metadata/${translation}.json`)
    const parsed = bibleMetadataSchema.parse(metadataModule.default)

    // Cache for future use
    metadataCache[translation] = parsed

    return parsed
}

/**
 * Gets the total number of verses in a book for a specific translation.
 * @param translation The Bible translation
 * @param book The book name
 * @returns Total verse count for the book
 */
export async function getBookVerseCount(
    translation: Translation,
    book: string,
): Promise<number> {
    const validatedBook = bookSchema.parse(book)
    const metadata = await getBibleMetadata(translation)
    const bookData = metadata[validatedBook]

    if (!bookData) {
        throw new Error(`Book ${book} not found in ${translation} metadata`)
    }

    return bookData.chapters.reduce((sum, ch) => sum + ch.length, 0)
}

/**
 * Gets the verse count for a specific chapter in a translation.
 * @param translation The Bible translation
 * @param book The book name
 * @param chapter The chapter number
 * @returns Verse count for the chapter
 */
export async function getChapterVerseCountForTranslation(
    translation: Translation,
    book: string,
    chapter: number,
): Promise<number> {
    const validatedBook = bookSchema.parse(book)
    const metadata = await getBibleMetadata(translation)
    const bookData = metadata[validatedBook]

    if (!bookData) {
        throw new Error(`Book ${book} not found in ${translation} metadata`)
    }

    const chapterData = bookData.chapters[chapter - 1]
    if (!chapterData) {
        throw new Error(
            `Chapter ${chapter} not found in ${book} for ${translation}`,
        )
    }

    return chapterData.length
}
