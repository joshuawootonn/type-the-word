import fs from "fs"
import path from "path"

import { env } from "~/env.mjs"
import { apiBibleIdToBook } from "~/lib/api-bible-book-id"
import { API_BIBLE_IDS, type ApiBibleTranslation } from "~/lib/api-bible-ids"
import { Book } from "~/lib/types/book"

const BASE_URL = "https://rest.api.bible/v1"

interface ChapterData {
    length: number
}

interface BookData {
    name: string
    testament: "OT" | "NT"
    chapters: ChapterData[]
}

type BibleMetadata = Record<Book, BookData>

async function fetchTranslationMetadata(
    translation: ApiBibleTranslation,
): Promise<BibleMetadata> {
    console.log(`Fetching metadata for ${translation.toUpperCase()}...`)

    const bibleId = API_BIBLE_IDS[translation]
    const metadata: Partial<BibleMetadata> = {}

    // Fetch all books
    const booksResponse = await fetch(`${BASE_URL}/bibles/${bibleId}/books`, {
        headers: { "api-key": env.API_BIBLE_API_KEY },
    })

    if (!booksResponse.ok) {
        throw new Error(
            `Failed to fetch books for ${translation}: ${booksResponse.statusText}`,
        )
    }

    const booksData = (await booksResponse.json()) as {
        data: Array<{ id: string; name: string }>
    }

    console.log(`  Found ${booksData.data.length} books`)

    // Process each book
    for (const book of booksData.data) {
        const internalBook = apiBibleIdToBook[book.id]
        if (!internalBook) {
            console.warn(`  Unknown book ID: ${book.id}, skipping`)
            continue
        }

        // Fetch chapters for this book
        const chaptersResponse = await fetch(
            `${BASE_URL}/bibles/${bibleId}/books/${book.id}/chapters`,
            { headers: { "api-key": env.API_BIBLE_API_KEY } },
        )

        if (!chaptersResponse.ok) {
            console.warn(
                `  Failed to fetch chapters for ${internalBook}: ${chaptersResponse.statusText}`,
            )
            continue
        }

        const chaptersData = (await chaptersResponse.json()) as {
            data: Array<{ id: string; number: string; verseCount?: number }>
        }

        // Filter numbered chapters only
        const numberedChapters = chaptersData.data.filter(ch => {
            const num = parseInt(ch.number, 10)
            return !isNaN(num) && num > 0
        })

        const chapters: ChapterData[] = []

        // Get verse counts (may need to fetch each chapter individually)
        for (const chapter of numberedChapters) {
            let verseCount = chapter.verseCount

            if (verseCount == null) {
                // Fetch individual chapter to get verse count
                const chapterResponse = await fetch(
                    `${BASE_URL}/bibles/${bibleId}/chapters/${chapter.id}`,
                    { headers: { "api-key": env.API_BIBLE_API_KEY } },
                )

                if (chapterResponse.ok) {
                    const chapterData = (await chapterResponse.json()) as {
                        data: { verseCount: number }
                    }
                    verseCount = chapterData.data.verseCount
                }
            }

            if (verseCount != null) {
                chapters.push({ length: verseCount })
            } else {
                console.warn(
                    `  No verse count for ${internalBook} ${chapter.number}`,
                )
            }
        }

        // Determine testament
        const otBooks: Book[] = [
            "genesis",
            "exodus",
            "leviticus",
            "numbers",
            "deuteronomy",
            "joshua",
            "judges",
            "ruth",
            "1_samuel",
            "2_samuel",
            "1_kings",
            "2_kings",
            "1_chronicles",
            "2_chronicles",
            "ezra",
            "nehemiah",
            "esther",
            "job",
            "psalm",
            "proverbs",
            "ecclesiastes",
            "song_of_solomon",
            "isaiah",
            "jeremiah",
            "lamentations",
            "ezekiel",
            "daniel",
            "hosea",
            "joel",
            "amos",
            "obadiah",
            "jonah",
            "micah",
            "nahum",
            "habakkuk",
            "zephaniah",
            "haggai",
            "zechariah",
            "malachi",
        ]

        metadata[internalBook] = {
            name: book.name,
            testament: otBooks.includes(internalBook) ? "OT" : "NT",
            chapters,
        }

        console.log(`  ✓ ${internalBook}: ${chapters.length} chapters`)
    }

    return metadata as BibleMetadata
}

async function main() {
    const translations: ApiBibleTranslation[] = [
        "bsb",
        "nlt",
        "niv",
        "csb",
        "nkjv",
        "nasb",
        "ntv",
        "msg",
    ]

    for (const translation of translations) {
        try {
            console.log(`\n${"=".repeat(50)}`)
            const metadata = await fetchTranslationMetadata(translation)

            // Write to file
            const outputPath = path.join(
                process.cwd(),
                "src/server/bible-metadata",
                `${translation}.json`,
            )

            fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2))
            console.log(`✅ Saved to ${outputPath}`)
        } catch (error) {
            console.error(`❌ Failed to fetch ${translation}:`, error)
        }
    }

    console.log("\n🎉 All translations hydrated!")
}

main().catch(console.error)
