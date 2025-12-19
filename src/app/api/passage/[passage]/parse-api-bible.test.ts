import fs from 'fs'
import path from 'path'
import { describe, expect, test } from 'vitest'

import { Paragraph } from '~/lib/parseEsv'

import { parseApiBibleChapter } from './parse-api-bible'

// Load the fixture
const genesis1Html = fs.readFileSync(
    path.join(process.cwd(), 'src/server/api-bible/responses/genesis-1.html'),
    'utf8',
)

describe('parseApiBibleChapter', () => {
    test('parses Genesis 1 from API.Bible fixture', () => {
        const result = parseApiBibleChapter(genesis1Html)

        // Should have nodes
        expect(result.nodes.length).toBeGreaterThan(0)

        // Should have a firstVerse
        expect(result.firstVerse).toBeDefined()
        expect(result.firstVerse.book).toBe('genesis')
        expect(result.firstVerse.chapter).toBe(1)
        expect(result.firstVerse.verse).toBe(1)
        expect(result.firstVerse.translation).toBe('bsb')
    })

    test('extracts section headers', () => {
        const result = parseApiBibleChapter(genesis1Html)

        // First node should be the h2 "The Creation"
        const h2 = result.nodes.find(n => n.type === 'h2')
        expect(h2).toBeDefined()
        expect(h2?.type).toBe('h2')
        if (h2?.type === 'h2') {
            expect(h2.text.trim()).toBe('The Creation')
        }

        // Should have section headers like "The First Day", "The Second Day"
        const h3s = result.nodes.filter(n => n.type === 'h3')
        expect(h3s.length).toBeGreaterThan(0)
    })

    test('extracts verse 1 correctly', () => {
        const result = parseApiBibleChapter(genesis1Html)

        // Find the first paragraph with verse 1
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === 'paragraph',
        )

        const verse1Paragraph = paragraphs.find(p =>
            p.nodes.some(v => v.verse.verse === 1),
        )

        expect(verse1Paragraph).toBeDefined()

        const verse1 = verse1Paragraph?.nodes.find(v => v.verse.verse === 1)
        expect(verse1).toBeDefined()
        expect(verse1?.text).toContain('In')
        expect(verse1?.text).toContain('beginning')
    })

    test('handles continuation verses (data-vid attribute)', () => {
        const result = parseApiBibleChapter(genesis1Html)

        // Verse 5 has a continuation paragraph:
        // <p data-vid="GEN 1:5" class="pmo">
        //     And there was evening, and there was morning—the first day.
        // </p>
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === 'paragraph',
        )

        // Find paragraphs that have verse 5 continuation (hanging verse)
        const verse5Continuations = paragraphs.flatMap(p =>
            p.nodes.filter(
                v => v.verse.verse === 5 && v.metadata.hangingVerse === true,
            ),
        )

        expect(verse5Continuations.length).toBeGreaterThan(0)
    })

    test('handles poetry formatting (q1, q2 classes)', () => {
        const result = parseApiBibleChapter(genesis1Html)

        // Verse 27 has poetry formatting:
        // <p class="q1">...So God created man in His own image;</p>
        // <p data-vid="GEN 1:27" class="q2">in the image of God He created him;</p>
        // <p data-vid="GEN 1:27" class="q2">male and female He created them.</p>

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === 'paragraph',
        )

        // Find verse 27
        const verse27 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 27),
        )

        // Should have multiple parts for verse 27 due to poetry formatting
        expect(verse27.length).toBeGreaterThanOrEqual(1)
    })

    test('parses all 31 verses', () => {
        const result = parseApiBibleChapter(genesis1Html)

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === 'paragraph',
        )

        // Get all unique verse numbers
        const verseNumbers = new Set<number>()
        for (const p of paragraphs) {
            for (const v of p.nodes) {
                verseNumbers.add(v.verse.verse)
            }
        }

        expect(verseNumbers.size).toBe(31)
        expect(verseNumbers.has(1)).toBe(true)
        expect(verseNumbers.has(31)).toBe(true)
    })

    test('generates correct prev/next chapter links', () => {
        const result = parseApiBibleChapter(genesis1Html)

        // Genesis 1 should have no prev chapter (it's the first chapter of the Bible)
        expect(result.prevChapter).toBeNull()

        // Genesis 1 should have next chapter pointing to Genesis 2
        expect(result.nextChapter).toBeDefined()
        expect(result.nextChapter?.url).toBe('genesis_2')
        expect(result.nextChapter?.label).toBe('Genesis 2')
    })

    test('skips cross-reference paragraphs (class="r")', () => {
        const result = parseApiBibleChapter(genesis1Html)

        // The fixture has:
        // <p class="r">
        //     (<span id="JHN.1.1-JHN.1.5">John 1:1–5</span>;...
        // </p>
        // These should be skipped (not included as verse content)

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === 'paragraph',
        )

        // No paragraph should contain "John 1:1–5" as verse text
        for (const p of paragraphs) {
            for (const v of p.nodes) {
                expect(v.text).not.toContain('John 1:1')
            }
        }
    })

    test('skips blank paragraphs (class="b")', () => {
        const result = parseApiBibleChapter(genesis1Html)

        // The fixture has <p class="b"></p> blank paragraphs
        // These should be skipped entirely

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === 'paragraph',
        )

        // No paragraph should have empty text
        for (const p of paragraphs) {
            expect(p.nodes.length).toBeGreaterThan(0)
        }
    })
})
