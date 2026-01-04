/**
 * Download script to fetch API.Bible fixtures for parser testing.
 *
 * Downloads 10 diverse chapters for each of 8 translations (80 total fixtures).
 * Includes rate limiting to respect API limits (~5000 requests/month).
 *
 * Run with: pnpm exec dotenv -e .env -- tsx ./src/scripts/download-api-bible-fixtures.ts
 */
import fs from 'fs'
import path from 'path'

import { env } from '~/env.mjs'
import { bookToApiBibleId } from '~/lib/api-bible-book-id'
import { API_BIBLE_IDS, ApiBibleTranslation } from '~/lib/api-bible-ids'

// 10 diverse chapters to test different Bible genres and formatting
const CHAPTERS_TO_DOWNLOAD: Array<{
    book: keyof typeof bookToApiBibleId
    chapter: number
    expectedVerses: number
    description: string
}> = [
    {
        book: 'genesis',
        chapter: 1,
        expectedVerses: 31,
        description: 'Creation narrative with poetry',
    },
    {
        book: 'exodus',
        chapter: 20,
        expectedVerses: 26,
        description: 'Ten Commandments',
    },
    {
        book: 'psalm',
        chapter: 23,
        expectedVerses: 6,
        description: 'Short poetry',
    },
    {
        book: 'psalm',
        chapter: 119,
        expectedVerses: 176,
        description: 'Long chapter with Hebrew letters',
    },
    {
        book: 'proverbs',
        chapter: 3,
        expectedVerses: 35,
        description: 'Wisdom literature',
    },
    {
        book: 'isaiah',
        chapter: 53,
        expectedVerses: 12,
        description: 'Prophetic poetry',
    },
    {
        book: 'matthew',
        chapter: 5,
        expectedVerses: 48,
        description: 'Sermon on the Mount',
    },
    {
        book: 'john',
        chapter: 1,
        expectedVerses: 51,
        description: 'Gospel prologue',
    },
    {
        book: 'romans',
        chapter: 8,
        expectedVerses: 39,
        description: 'Epistle',
    },
    {
        book: 'revelation',
        chapter: 21,
        expectedVerses: 27,
        description: 'Apocalyptic',
    },
]

const BASE_URL = 'https://rest.api.bible/v1'

// Rate limiting: wait between requests to avoid hitting API limits
const DELAY_MS = 500

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchPassage(
    translation: ApiBibleTranslation,
    book: keyof typeof bookToApiBibleId,
    chapter: number,
): Promise<string> {
    const bibleId = API_BIBLE_IDS[translation]
    const bookId = bookToApiBibleId[book]
    const passageId = `${bookId}.${chapter}`

    const params = new URLSearchParams({
        'content-type': 'html',
        'include-notes': 'false',
        'include-titles': 'true',
        'include-chapter-numbers': 'false',
        'include-verse-numbers': 'true',
        'include-verse-spans': 'true',
        'use-org-id': 'false',
    })

    const url = `${BASE_URL}/bibles/${bibleId}/passages/${passageId}?${params.toString()}`

    const response = await fetch(url, {
        headers: {
            'api-key': env.API_BIBLE_API_KEY,
        },
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(
            `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
        )
    }

    const json = await response.json()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return json.data.content
}

function getFilePath(
    translation: ApiBibleTranslation,
    book: string,
    chapter: number,
): string {
    const responsesDir = path.join(
        process.cwd(),
        'src/server/api-bible/responses',
        translation,
    )

    // Create directory if it doesn't exist
    if (!fs.existsSync(responsesDir)) {
        fs.mkdirSync(responsesDir, { recursive: true })
    }

    return path.join(responsesDir, `${book}_${chapter}.html`)
}

async function downloadFixtures() {
    console.log('API.Bible Fixture Download Script')
    console.log('==================================\n')

    const translations = Object.keys(
        API_BIBLE_IDS,
    ) as Array<ApiBibleTranslation>
    const totalDownloads = translations.length * CHAPTERS_TO_DOWNLOAD.length
    let completed = 0
    let skipped = 0
    let failed = 0

    for (const translation of translations) {
        console.log(`\n📖 Translation: ${translation.toUpperCase()}`)
        console.log('-'.repeat(40))

        for (const chapter of CHAPTERS_TO_DOWNLOAD) {
            const filePath = getFilePath(
                translation,
                chapter.book,
                chapter.chapter,
            )

            // Skip if file already exists
            if (fs.existsSync(filePath)) {
                console.log(
                    `  ⏭️  ${chapter.book} ${chapter.chapter} - already exists`,
                )
                skipped++
                completed++
                continue
            }

            try {
                console.log(
                    `  ⬇️  Downloading ${chapter.book} ${chapter.chapter} (${chapter.description})...`,
                )

                const content = await fetchPassage(
                    translation,
                    chapter.book,
                    chapter.chapter,
                )

                fs.writeFileSync(filePath, content)
                console.log(`  ✅ Saved to ${path.basename(filePath)}`)

                completed++

                // Rate limiting
                await sleep(DELAY_MS)
            } catch (error) {
                console.error(
                    `  ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                )
                failed++
                completed++
            }
        }
    }

    console.log('\n' + '='.repeat(40))
    console.log('Download Complete!')
    console.log(`  Total: ${totalDownloads}`)
    console.log(`  Downloaded: ${completed - skipped - failed}`)
    console.log(`  Skipped (already existed): ${skipped}`)
    console.log(`  Failed: ${failed}`)
}

// Run the script
downloadFixtures()
    .then(() => {
        console.log('\nDone!')
        process.exit(0)
    })
    .catch(error => {
        console.error('\nFatal error:', error)
        process.exit(1)
    })
