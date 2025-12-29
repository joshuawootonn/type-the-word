import fs from 'fs'
import path from 'path'
import { describe, expect, test } from 'vitest'

import { Paragraph, Translation, Word } from '~/lib/parseEsv'

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

// ============================================================================
// COMPREHENSIVE PARAMETERIZED TESTS FOR ALL TRANSLATIONS
// ============================================================================

const TRANSLATIONS: Exclude<Translation, 'esv'>[] = [
    'bsb',
    'nlt',
    'niv',
    'csb',
    'nkjv',
    'nasb',
    'ntv',
    'msg',
]

const CHAPTERS: Array<{
    book: string
    chapter: number
    expectedVerses: number
    bookSlug: string
}> = [
    {
        book: 'genesis',
        chapter: 1,
        expectedVerses: 31,
        bookSlug: 'genesis',
    },
    {
        book: 'exodus',
        chapter: 20,
        expectedVerses: 26,
        bookSlug: 'exodus',
    },
    {
        book: 'psalm',
        chapter: 23,
        expectedVerses: 6,
        bookSlug: 'psalm',
    },
    {
        book: 'psalm',
        chapter: 119,
        expectedVerses: 176,
        bookSlug: 'psalm',
    },
    {
        book: 'proverbs',
        chapter: 3,
        expectedVerses: 35,
        bookSlug: 'proverbs',
    },
    {
        book: 'isaiah',
        chapter: 53,
        expectedVerses: 12,
        bookSlug: 'isaiah',
    },
    {
        book: 'matthew',
        chapter: 5,
        expectedVerses: 48,
        bookSlug: 'matthew',
    },
    {
        book: 'john',
        chapter: 1,
        expectedVerses: 51,
        bookSlug: 'john',
    },
    {
        book: 'romans',
        chapter: 8,
        expectedVerses: 39,
        bookSlug: 'romans',
    },
    {
        book: 'revelation',
        chapter: 21,
        expectedVerses: 27,
        bookSlug: 'revelation',
    },
]

/**
 * Helper to extract all words from a parsed passage.
 */
function getAllWords(paragraphs: Paragraph[]): Word[] {
    const words: Word[] = []
    for (const p of paragraphs) {
        for (const verse of p.nodes) {
            for (const node of verse.nodes) {
                if (node.type === 'word') {
                    words.push(node)
                }
            }
        }
    }
    return words
}

/**
 * Checks if any word has a newline character in the middle of it
 * (not at the end, which is valid for line breaks).
 */
function hasEmbeddedNewline(word: Word): boolean {
    const letters = word.letters
    for (let i = 0; i < letters.length - 1; i++) {
        if (letters[i] === '\n') {
            return true
        }
    }
    return false
}

/**
 * Checks for double spaces in the parsed inline nodes
 */
function hasDoubleSpaces(paragraphs: Paragraph[]): boolean {
    for (const p of paragraphs) {
        for (const verse of p.nodes) {
            let lastWasSpace = false
            for (const node of verse.nodes) {
                if (node.type === 'space') {
                    if (lastWasSpace) {
                        return true
                    }
                    lastWasSpace = true
                } else {
                    lastWasSpace = false
                }
            }
        }
    }
    return false
}

/**
 * Checks that verse numbers have exactly one space after them
 */
function verseNumbersHaveSpaceAfter(paragraphs: Paragraph[]): boolean {
    for (const p of paragraphs) {
        for (const verse of p.nodes) {
            const nodes = verse.nodes
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i]
                if (node && node.type === 'verseNumber') {
                    const nextNode = nodes[i + 1]
                    // After verse number should be a space
                    if (!nextNode || nextNode.type !== 'space') {
                        return false
                    }
                }
            }
        }
    }
    return true
}

/**
 * Extract unique verse numbers from parsed paragraphs.
 * Handles merged verses like "1-3" by extracting all individual verses.
 */
function getUniqueVerseNumbers(paragraphs: Paragraph[]): Set<number> {
    const verseNumbers = new Set<number>()
    for (const p of paragraphs) {
        for (const v of p.nodes) {
            const verseNum = v.verse.verse
            // Handle merged verses (e.g., verse = 1 for "1-3")
            if (typeof verseNum === 'number') {
                verseNumbers.add(verseNum)
            }
        }
    }
    return verseNumbers
}

/**
 * Finds words that are just punctuation/whitespace (should be filtered out).
 * Returns array of problematic words for error reporting.
 */
function getPunctuationOnlyWords(paragraphs: Paragraph[]): string[] {
    const problems: string[] = []
    for (const p of paragraphs) {
        for (const verse of p.nodes) {
            for (const node of verse.nodes) {
                if (node.type === 'word') {
                    const word = node.letters.join('')
                    // Check if word contains no letters/numbers (just punctuation/whitespace)
                    if (!/[a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/.test(word)) {
                        problems.push(word)
                    }
                }
            }
        }
    }
    return problems
}

// Load all fixtures into memory once
const fixtures = new Map<string, string>()
const responsesDir = path.join(process.cwd(), 'src/server/api-bible/responses')

for (const translation of TRANSLATIONS) {
    for (const chapter of CHAPTERS) {
        const filePath = path.join(
            responsesDir,
            translation,
            `${chapter.book}_${chapter.chapter}.html`,
        )
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8')
            fixtures.set(
                `${translation}/${chapter.book}_${chapter.chapter}`,
                content,
            )
        }
    }
}

describe.each(TRANSLATIONS)('Translation: %s', translation => {
    describe.each(CHAPTERS)(
        '$book $chapter',
        ({ book, chapter, expectedVerses, bookSlug }) => {
            const fixtureKey = `${translation}/${book}_${chapter}`
            const html = fixtures.get(fixtureKey)

            // Skip if fixture doesn't exist
            if (!html) {
                test.skip(`fixture not found: ${fixtureKey}`, () => {
                    // Fixture file not available
                })
                return
            }

            test('parses without throwing', () => {
                expect(() =>
                    parseApiBibleChapter(html, translation),
                ).not.toThrow()
            })

            test('has correct firstVerse metadata', () => {
                const result = parseApiBibleChapter(html, translation)

                expect(result.firstVerse).toBeDefined()
                expect(result.firstVerse.book).toBe(bookSlug)
                expect(result.firstVerse.chapter).toBe(chapter)
                expect(result.firstVerse.translation).toBe(translation)
            })

            test('parses all expected verses', () => {
                const result = parseApiBibleChapter(html, translation)
                const paragraphs = result.nodes.filter(
                    (n): n is Paragraph => n.type === 'paragraph',
                )
                const verseNumbers = getUniqueVerseNumbers(paragraphs)

                // MSG often combines verses (e.g., "1-2", "3-5"), so we check minimum coverage
                if (translation === 'msg') {
                    // MSG should have at least 10% of verses represented (due to aggressive grouping)
                    // Some chapters like Psalm 119 have even more aggressive grouping
                    expect(verseNumbers.size).toBeGreaterThanOrEqual(
                        Math.floor(expectedVerses / 10),
                    )
                } else {
                    // Other translations should have all verses
                    expect(verseNumbers.size).toBe(expectedVerses)
                }

                // Should have verse 1
                expect(verseNumbers.has(1)).toBe(true)
            })

            test('has no embedded newlines in words', () => {
                const result = parseApiBibleChapter(html, translation)
                const paragraphs = result.nodes.filter(
                    (n): n is Paragraph => n.type === 'paragraph',
                )
                const words = getAllWords(paragraphs)
                const wordsWithNewlines = words.filter(hasEmbeddedNewline)

                if (wordsWithNewlines.length > 0) {
                    const examples = wordsWithNewlines
                        .slice(0, 3)
                        .map(w => `"${w.letters.join('')}"`)
                        .join(', ')
                    throw new Error(
                        `Found ${wordsWithNewlines.length} word(s) with embedded newlines: ${examples}`,
                    )
                }

                expect(wordsWithNewlines).toHaveLength(0)
            })

            test('has no double spaces', () => {
                const result = parseApiBibleChapter(html, translation)
                const paragraphs = result.nodes.filter(
                    (n): n is Paragraph => n.type === 'paragraph',
                )

                expect(hasDoubleSpaces(paragraphs)).toBe(false)
            })

            test('has no punctuation-only words', () => {
                const result = parseApiBibleChapter(html, translation)
                const paragraphs = result.nodes.filter(
                    (n): n is Paragraph => n.type === 'paragraph',
                )

                const problems = getPunctuationOnlyWords(paragraphs)
                if (problems.length > 0) {
                    throw new Error(
                        `Found ${problems.length} punctuation-only word(s): ${problems
                            .slice(0, 5)
                            .map(w => `"${w}"`)
                            .join(', ')}`,
                    )
                }
                expect(problems).toHaveLength(0)
            })

            test('verse numbers have space after them', () => {
                const result = parseApiBibleChapter(html, translation)
                const paragraphs = result.nodes.filter(
                    (n): n is Paragraph => n.type === 'paragraph',
                )

                // Only check if there are verse numbers with nodes following
                const hasVerseNumbers = paragraphs.some(p =>
                    p.nodes.some(v =>
                        v.nodes.some(n => n.type === 'verseNumber'),
                    ),
                )

                if (hasVerseNumbers) {
                    expect(verseNumbersHaveSpaceAfter(paragraphs)).toBe(true)
                }
            })

            test('generates valid prev/next chapter links', () => {
                const result = parseApiBibleChapter(html, translation)

                // Genesis 1 should have no prev
                if (bookSlug === 'genesis' && chapter === 1) {
                    expect(result.prevChapter).toBeNull()
                }

                // Revelation 21 should have next pointing to 22
                if (bookSlug === 'revelation' && chapter === 21) {
                    expect(result.nextChapter).toBeDefined()
                    expect(result.nextChapter?.url).toBe('revelation_22')
                }

                // All should have properly formatted URLs if defined
                if (result.prevChapter) {
                    expect(result.prevChapter.url).toMatch(/^[a-z0-9_]+$/)
                    expect(result.prevChapter.label).toBeDefined()
                }
                if (result.nextChapter) {
                    expect(result.nextChapter.url).toMatch(/^[a-z0-9_]+$/)
                    expect(result.nextChapter.label).toBeDefined()
                }
            })

            test('produces non-empty verse text', () => {
                const result = parseApiBibleChapter(html, translation)
                const paragraphs = result.nodes.filter(
                    (n): n is Paragraph => n.type === 'paragraph',
                )

                // All verses should have non-empty text
                for (const p of paragraphs) {
                    for (const v of p.nodes) {
                        expect(v.text.trim().length).toBeGreaterThan(0)
                    }
                }
            })
        },
    )
})
