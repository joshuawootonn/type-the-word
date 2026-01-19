import { and, eq, sql } from "drizzle-orm"
import { PostgresJsDatabase } from "drizzle-orm/postgres-js"

import toProperCase from "~/lib/toProperCase"
import { bookSchema } from "~/lib/types/book"
import * as schema from "~/server/db/schema"

export type DailyActivityRow = typeof schema.userDailyActivity.$inferSelect

/**
 * Stats for a single verse (from calculateStatsForVerse)
 */
export type VerseStats = {
    wpm: number
    accuracy: number
    correctedAccuracy: number
}

/**
 * Parsed passage data from a passage string
 */
export type ParsedPassage = {
    book: schema.Book
    chapter: number
    verses: number[]
    translation?: schema.Translation
}

/**
 * Format a single verse reference for display
 * e.g., "Genesis 1:1" or "1 Corinthians 13:4"
 */
export function formatVerseReference(
    book: schema.Book,
    chapter: number,
    verse: number,
): string {
    const bookName = toProperCase(book.split("_").join(" "))
    return `${bookName} ${chapter}:${verse}`
}

/**
 * Parse a passage string into structured data
 * e.g., "Genesis 1:1" -> { book: 'genesis', chapter: 1, verses: [1] }
 * e.g., "Luke 7:24-36" -> { book: 'luke', chapter: 7, verses: [24,25,...,36] }
 * e.g., "1 Corinthians 13:4-7, 10" -> { book: '1_corinthians', chapter: 13, verses: [4,5,6,7,10] }
 * e.g., "Genesis 1:1 (ESV)" -> { book: 'genesis', chapter: 1, verses: [1], translation: 'esv' }
 */
export function parsePassageString(passage: string): ParsedPassage | null {
    // Extract translation suffix if present: "Genesis 1:1 (ESV)" -> translation = "esv"
    let translation: schema.Translation | undefined
    let passageWithoutTranslation = passage
    const translationMatch = passage.match(/\s+\(([A-Z]+)\)$/)
    if (translationMatch?.[1]) {
        translation = translationMatch[1].toLowerCase() as schema.Translation
        passageWithoutTranslation = passage
            .slice(0, -translationMatch[0].length)
            .trim()
    }

    // Match pattern: "Book Name Chapter:Verses"
    // Book name can include numbers at start (1 Corinthians) and multiple words (Song Of Solomon)
    // Verses can be single (1), range (1-5), or comma-separated (1-3, 5, 7-9)
    const match = passageWithoutTranslation.match(/^(.+?)\s+(\d+):(.+)$/)
    if (!match) return null

    const [, bookName, chapterStr, versesStr] = match
    if (!bookName || !chapterStr || !versesStr) return null

    // Convert book name to schema format: "1 Corinthians" -> "1_corinthians"
    const bookKey = bookName.toLowerCase().split(" ").join("_")

    // Validate it's a valid book
    const parseResult = bookSchema.safeParse(bookKey)
    if (!parseResult.success) return null

    const book = parseResult.data
    const chapter = parseInt(chapterStr, 10)

    // Parse verses - handle ranges (1-5) and individual verses (1, 3, 5)
    const verses: number[] = []
    const verseParts = versesStr.split(",").map(s => s.trim())

    for (const part of verseParts) {
        if (part.includes("-")) {
            const [startStr, endStr] = part.split("-")
            const start = parseInt(startStr!, 10)
            const end = parseInt(endStr!, 10)
            if (!isNaN(start) && !isNaN(end)) {
                for (let v = start; v <= end; v++) {
                    verses.push(v)
                }
            }
        } else {
            const v = parseInt(part, 10)
            if (!isNaN(v)) {
                verses.push(v)
            }
        }
    }

    return { book, chapter, verses, translation }
}

/**
 * Consolidate consecutive verses into ranges
 * e.g., [1, 2, 3, 5, 7, 8, 9] -> [[1,2,3], [5], [7,8,9]] -> "1-3, 5, 7-9"
 */
function formatVerseSegments(verses: number[]): string {
    const uniqueVerses = Array.from(new Set(verses)).sort((a, b) => a - b)

    const segments = uniqueVerses.reduce<number[][]>(
        (acc, verse) => {
            const lastSegment = acc.at(-1)
            const lastNumberInLastSegment = lastSegment?.at(-1)

            if (lastNumberInLastSegment === undefined) {
                return [[verse]]
            }

            if (verse === lastNumberInLastSegment + 1) {
                lastSegment?.push(verse)
            } else {
                acc.push([verse])
            }

            return acc
        },
        [[]],
    )

    return segments
        .filter(segment => segment.length > 0)
        .map(segment => {
            if (segment.length === 1) {
                return String(segment[0])
            }
            return `${segment[0]}-${segment.at(-1)}`
        })
        .join(", ")
}

/**
 * Key for grouping passages by book, chapter, and translation
 */
type PassageKey = `${schema.Book}:${number}:${schema.Translation}`

/**
 * Consolidate passages by merging consecutive verses into ranges.
 * Takes existing passages and a new verse with translation, returns a consolidated array.
 * Each passage includes the translation suffix (e.g., "Genesis 1:1-5 (ESV)").
 *
 * Example:
 * Input: ["Luke 7:24-36 (ESV)", "Luke 7:37 (ESV)"], newVerse: {book: 'luke', chapter: 7, verse: 38}, translation: 'esv'
 * Output: ["Luke 7:24-38 (ESV)"]
 */
export function consolidatePassages(
    existingPassages: string[],
    newVerse: { book: schema.Book; chapter: number; verse: number },
    translation: schema.Translation,
): string[] {
    // Build a map of (book, chapter, translation) -> verses
    const passageMap = new Map<PassageKey, Set<number>>()

    // Parse existing passages
    for (const passage of existingPassages) {
        const parsed = parsePassageString(passage)
        if (!parsed) continue

        // Use the parsed translation or default to 'esv' for legacy passages
        const passageTranslation = parsed.translation ?? "esv"
        const key: PassageKey = `${parsed.book}:${parsed.chapter}:${passageTranslation}`

        if (!passageMap.has(key)) {
            passageMap.set(key, new Set())
        }
        const versesSet = passageMap.get(key)!
        for (const v of parsed.verses) {
            versesSet.add(v)
        }
    }

    // Add new verse with the given translation
    const newKey: PassageKey = `${newVerse.book}:${newVerse.chapter}:${translation}`
    if (!passageMap.has(newKey)) {
        passageMap.set(newKey, new Set())
    }
    passageMap.get(newKey)!.add(newVerse.verse)

    // Convert back to passage strings with translation suffix
    const result: string[] = []
    for (const [key, versesSet] of passageMap) {
        const [book, chapterStr, trans] = key.split(":") as [
            schema.Book,
            string,
            schema.Translation,
        ]
        const bookName = toProperCase(book.split("_").join(" "))
        const chapter = parseInt(chapterStr, 10)
        const versesArray = Array.from(versesSet)
        const versesFormatted = formatVerseSegments(versesArray)
        result.push(
            `${bookName} ${chapter}:${versesFormatted} (${trans.toUpperCase()})`,
        )
    }

    return result
}

export class UserDailyActivityRepository {
    db: PostgresJsDatabase<typeof schema>
    constructor(db: PostgresJsDatabase<typeof schema>) {
        this.db = db
    }

    /**
     * Get all daily activity for a user, ordered by date descending
     */
    async getByUserId(userId: string): Promise<DailyActivityRow[]> {
        return this.db.query.userDailyActivity.findMany({
            where: eq(schema.userDailyActivity.userId, userId),
            orderBy: (activity, { desc }) => [desc(activity.date)],
        })
    }

    /**
     * Record activity for a single verse typed
     * Uses read-modify-write to consolidate passages into ranges (e.g., "Luke 7:24-38 (ESV)")
     * Optionally updates running averages for WPM/accuracy if stats are provided
     */
    async recordActivity(
        userId: string,
        date: Date,
        book: schema.Book,
        chapter: number,
        verse: number,
        translation: schema.Translation,
        stats?: VerseStats | null,
    ): Promise<void> {
        // Normalize to start of day (UTC)
        const dayStart = new Date(date)
        dayStart.setUTCHours(0, 0, 0, 0)

        // Read existing record to get current passages
        const existing = await this.db.query.userDailyActivity.findFirst({
            where: and(
                eq(schema.userDailyActivity.userId, userId),
                eq(schema.userDailyActivity.date, dayStart),
            ),
        })

        // Consolidate passages with the new verse and translation
        const consolidatedPassages = consolidatePassages(
            existing?.passages ?? [],
            { book, chapter, verse },
            translation,
        )

        if (stats) {
            // Insert with stats - update running averages on conflict
            await this.db
                .insert(schema.userDailyActivity)
                .values({
                    userId,
                    date: dayStart,
                    verseCount: 1,
                    passages: consolidatedPassages,
                    averageWpm: stats.wpm,
                    averageAccuracy: stats.accuracy,
                    averageCorrectedAccuracy: stats.correctedAccuracy,
                    versesWithStats: 1,
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: [
                        schema.userDailyActivity.userId,
                        schema.userDailyActivity.date,
                    ],
                    set: {
                        verseCount: sql`${schema.userDailyActivity.verseCount} + 1`,
                        passages: consolidatedPassages,
                        // Update running averages: newAvg = (oldAvg * oldCount + newValue) / (oldCount + 1)
                        averageWpm: sql`
                            ROUND(
                                (COALESCE(${schema.userDailyActivity.averageWpm}, 0) * ${schema.userDailyActivity.versesWithStats} + ${stats.wpm})::numeric 
                                / (${schema.userDailyActivity.versesWithStats} + 1)
                            )::integer
                        `,
                        averageAccuracy: sql`
                            ROUND(
                                (COALESCE(${schema.userDailyActivity.averageAccuracy}, 0) * ${schema.userDailyActivity.versesWithStats} + ${stats.accuracy})::numeric 
                                / (${schema.userDailyActivity.versesWithStats} + 1)
                            )::integer
                        `,
                        averageCorrectedAccuracy: sql`
                            ROUND(
                                (COALESCE(${schema.userDailyActivity.averageCorrectedAccuracy}, 0) * ${schema.userDailyActivity.versesWithStats} + ${stats.correctedAccuracy})::numeric 
                                / (${schema.userDailyActivity.versesWithStats} + 1)
                            )::integer
                        `,
                        versesWithStats: sql`${schema.userDailyActivity.versesWithStats} + 1`,
                        updatedAt: new Date(),
                    },
                })
        } else {
            // Insert without stats - just update verse count and passages
            await this.db
                .insert(schema.userDailyActivity)
                .values({
                    userId,
                    date: dayStart,
                    verseCount: 1,
                    passages: consolidatedPassages,
                    versesWithStats: 0,
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: [
                        schema.userDailyActivity.userId,
                        schema.userDailyActivity.date,
                    ],
                    set: {
                        verseCount: sql`${schema.userDailyActivity.verseCount} + 1`,
                        passages: consolidatedPassages,
                        updatedAt: new Date(),
                    },
                })
        }
    }

    /**
     * Batch upsert for backfill - sets exact values
     */
    async batchUpsert(
        data: Array<{
            userId: string
            date: Date
            verseCount: number
            passages: string[]
            averageWpm?: number | null
            averageAccuracy?: number | null
            averageCorrectedAccuracy?: number | null
            versesWithStats?: number
        }>,
    ): Promise<void> {
        for (const row of data) {
            // Normalize to start of day (UTC)
            const dayStart = new Date(row.date)
            dayStart.setUTCHours(0, 0, 0, 0)

            // Normalize passages to include translation suffix (default to ESV for legacy passages)
            const normalizedPassages = row.passages.map(passage => {
                const parsed = parsePassageString(passage)
                if (!parsed) return passage

                // If no translation suffix, assume ESV
                const translation = parsed.translation ?? "esv"
                const bookName = toProperCase(parsed.book.split("_").join(" "))
                const versesFormatted = formatVerseSegments(parsed.verses)
                return `${bookName} ${parsed.chapter}:${versesFormatted} (${translation.toUpperCase()})`
            })

            await this.db
                .insert(schema.userDailyActivity)
                .values({
                    userId: row.userId,
                    date: dayStart,
                    verseCount: row.verseCount,
                    passages: normalizedPassages,
                    averageWpm: row.averageWpm ?? null,
                    averageAccuracy: row.averageAccuracy ?? null,
                    averageCorrectedAccuracy:
                        row.averageCorrectedAccuracy ?? null,
                    versesWithStats: row.versesWithStats ?? 0,
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: [
                        schema.userDailyActivity.userId,
                        schema.userDailyActivity.date,
                    ],
                    set: {
                        verseCount: row.verseCount,
                        passages: normalizedPassages,
                        averageWpm: row.averageWpm ?? null,
                        averageAccuracy: row.averageAccuracy ?? null,
                        averageCorrectedAccuracy:
                            row.averageCorrectedAccuracy ?? null,
                        versesWithStats: row.versesWithStats ?? 0,
                        updatedAt: new Date(),
                    },
                })
        }
    }
}
