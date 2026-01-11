/**
 * Download a single fixture from API.Bible
 * Run with: pnpm exec dotenv -e .env -- tsx ./src/scripts/download-single-fixture.ts
 */
import fs from 'fs'
import path from 'path'
import { z } from 'zod'

import { env } from '~/env.mjs'
import { bookToApiBibleId } from '~/lib/api-bible-book-id'
import { API_BIBLE_IDS, ApiBibleTranslation } from '~/lib/api-bible-ids'

const TRANSLATION: ApiBibleTranslation = 'nasb'
const BOOK: keyof typeof bookToApiBibleId = 'luke'
const CHAPTER = 19

const apiBibleResponseSchema = z.object({
    data: z.object({
        content: z.string(),
    }),
})

async function main() {
    const bibleId = API_BIBLE_IDS[TRANSLATION]
    const bookId = bookToApiBibleId[BOOK]
    const passageId = `${bookId}.${CHAPTER}`

    const params = new URLSearchParams({
        'content-type': 'html',
        'include-notes': 'false',
        'include-titles': 'true',
        'include-chapter-numbers': 'false',
        'include-verse-numbers': 'true',
        'include-verse-spans': 'true',
        'use-org-id': 'false',
    })

    const url = `https://rest.api.bible/v1/bibles/${bibleId}/passages/${passageId}?${params.toString()}`

    console.log(
        `Downloading ${BOOK} ${CHAPTER} (${TRANSLATION.toUpperCase()})...`,
    )

    const response = await fetch(url, {
        headers: {
            'api-key': env.API_BIBLE_API_KEY,
        },
    })

    if (!response.ok) {
        throw new Error(`Failed: ${response.status} ${response.statusText}`)
    }

    const json = apiBibleResponseSchema.parse(await response.json())

    const dir = path.join(
        process.cwd(),
        'src/server/api-bible/responses',
        TRANSLATION,
    )
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(
        path.join(dir, `${BOOK}_${CHAPTER}.html`),
        json.data.content,
    )
    console.log(`✅ Saved to ${TRANSLATION}/${BOOK}_${CHAPTER}.html`)
}

main().catch(console.error)
