import fs from "fs"
import path from "path"
import { describe, expect, test } from "vitest"

import { isAtomTyped } from "~/lib/isEqual"
import { Decoration, Paragraph, Translation, Word } from "~/lib/parseEsv"

import { parseApiBibleChapter } from "./parse-api-bible"

// Memoization cache for parsed results
const parseCache = new Map<
    string,
    Awaited<ReturnType<typeof parseApiBibleChapter>>
>()

async function cachedParseApiBibleChapter(
    html: string,
    translation?: Exclude<Translation, "esv">,
) {
    const key = `${html.slice(0, 100)}-${translation || "default"}`
    if (!parseCache.has(key)) {
        const result = await parseApiBibleChapter(html, translation)
        parseCache.set(key, result)
    }
    return parseCache.get(key)!
}

// Load the fixture
const genesis1Html = fs.readFileSync(
    path.join(process.cwd(), "src/server/api-bible/responses/genesis-1.html"),
    "utf8",
)

describe("parseApiBibleChapter", () => {
    test.concurrent("parses Genesis 1 from API.Bible fixture", async () => {
        const genesis1Result = await cachedParseApiBibleChapter(genesis1Html)
        // Should have nodes
        expect(genesis1Result.nodes.length).toBeGreaterThan(0)

        // Should have a firstVerse
        expect(genesis1Result.firstVerse).toBeDefined()
        expect(genesis1Result.firstVerse.book).toBe("genesis")
        expect(genesis1Result.firstVerse.chapter).toBe(1)
        expect(genesis1Result.firstVerse.verse).toBe(1)
        expect(genesis1Result.firstVerse.translation).toBe("bsb")
    })

    test.concurrent("extracts section headers", async () => {
        const genesis1Result = await cachedParseApiBibleChapter(genesis1Html)
        // First node should be the h2 "The Creation"
        const h2 = genesis1Result.nodes.find(n => n.type === "h2")
        expect(h2).toBeDefined()
        expect(h2?.type).toBe("h2")
        if (h2?.type === "h2") {
            expect(h2.text.trim()).toBe("The Creation")
        }

        // Should have section headers like "The First Day", "The Second Day"
        const h3s = genesis1Result.nodes.filter(n => n.type === "h3")
        expect(h3s.length).toBeGreaterThan(0)
    })

    test.concurrent("extracts verse 1 correctly", async () => {
        const genesis1Result = await cachedParseApiBibleChapter(genesis1Html)
        // Find the first paragraph with verse 1
        const paragraphs = genesis1Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verse1Paragraph = paragraphs.find(p =>
            p.nodes.some(v => v.verse.verse === 1),
        )

        expect(verse1Paragraph).toBeDefined()

        const verse1 = verse1Paragraph?.nodes.find(v => v.verse.verse === 1)
        expect(verse1).toBeDefined()
        expect(verse1?.text).toContain("In")
        expect(verse1?.text).toContain("beginning")
    })

    test.concurrent("handles continuation verses (data-vid attribute)", async () => {
        const genesis1Result = await cachedParseApiBibleChapter(genesis1Html)
        // Verse 5 has a continuation paragraph:
        // <p data-vid="GEN 1:5" class="pmo">
        //     And there was evening, and there was morning—the first day.
        // </p>
        const paragraphs = genesis1Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Find paragraphs that have verse 5 continuation (hanging verse)
        const verse5Continuations = paragraphs.flatMap(p =>
            p.nodes.filter(
                v => v.verse.verse === 5 && v.metadata.hangingVerse === true,
            ),
        )

        expect(verse5Continuations.length).toBeGreaterThan(0)
    })

    test.concurrent("handles poetry formatting (q1, q2 classes)", async () => {
        const genesis1Result = await cachedParseApiBibleChapter(genesis1Html)
        // Verse 27 has poetry formatting:
        // <p class="q1">...So God created man in His own image;</p>
        // <p data-vid="GEN 1:27" class="q2">in the image of God He created him;</p>
        // <p data-vid="GEN 1:27" class="q2">male and female He created them.</p>

        const paragraphs = genesis1Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Find verse 27
        const verse27 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 27),
        )

        // Should have multiple parts for verse 27 due to poetry formatting
        expect(verse27.length).toBeGreaterThanOrEqual(1)
    })

    test.concurrent("parses all 31 verses", async () => {
        const genesis1Result = await cachedParseApiBibleChapter(genesis1Html)
        const paragraphs = genesis1Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
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

    test.concurrent("generates correct prev/next chapter links", async () => {
        const genesis1Result = await cachedParseApiBibleChapter(genesis1Html)
        // Genesis 1 should have no prev chapter (it's the first chapter of the Bible)
        expect(genesis1Result.prevChapter).toBeNull()

        // Genesis 1 should have next chapter pointing to Genesis 2
        expect(genesis1Result.nextChapter).toBeDefined()
        expect(genesis1Result.nextChapter?.url).toBe("genesis_2")
        expect(genesis1Result.nextChapter?.label).toBe("Genesis 2")
    })

    test('skips cross-reference paragraphs (class="r")', async () => {
        const genesis1Result = await cachedParseApiBibleChapter(genesis1Html)
        // The fixture has:
        // <p class="r">
        //     (<span id="JHN.1.1-JHN.1.5">John 1:1–5</span>;...
        // </p>
        // These should be skipped (not included as verse content)

        const paragraphs = genesis1Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // No paragraph should contain "John 1:1–5" as verse text
        for (const p of paragraphs) {
            for (const v of p.nodes) {
                expect(v.text).not.toContain("John 1:1")
            }
        }
    })

    test('skips blank paragraphs (class="b")', async () => {
        const genesis1Result = await cachedParseApiBibleChapter(genesis1Html)
        // The fixture has <p class="b"></p> blank paragraphs
        // These should be skipped entirely

        const paragraphs = genesis1Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // No paragraph should have empty text
        for (const p of paragraphs) {
            expect(p.nodes.length).toBeGreaterThan(0)
        }
    })
})

describe("Opening paragraph handling (po class)", () => {
    // NIV epistles use <p class="po"> for opening paragraphs
    // This is common in letters like Romans, James, etc.

    const nivRomans1Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/niv/romans_1.html",
        ),
        "utf8",
    )

    const nivJames1Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/niv/james_1.html",
        ),
        "utf8",
    )

    test.concurrent("parses NIV Romans 1 verse 1 from opening paragraph", async () => {
        const result = await cachedParseApiBibleChapter(nivRomans1Html, "niv")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Find verse 1
        const verse1 = paragraphs
            .flatMap(p => p.nodes)
            .find(v => v.verse.verse === 1)

        expect(verse1).toBeDefined()
        expect(verse1?.text).toContain("Paul")
        expect(verse1?.text).toContain("servant")
    })

    test.concurrent("parses NIV James 1 verse 1 from opening paragraph", async () => {
        const result = await cachedParseApiBibleChapter(nivJames1Html, "niv")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Find verse 1
        const verse1 = paragraphs
            .flatMap(p => p.nodes)
            .find(v => v.verse.verse === 1)

        expect(verse1).toBeDefined()
        expect(verse1?.text).toContain("James")
        expect(verse1?.text).toContain("servant")
    })

    test.concurrent("parses all 32 verses in NIV Romans 1", async () => {
        const result = await cachedParseApiBibleChapter(nivRomans1Html, "niv")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verseNumbers = new Set<number>()
        for (const p of paragraphs) {
            for (const verse of p.nodes) {
                verseNumbers.add(verse.verse.verse)
            }
        }

        expect(verseNumbers.size).toBe(32)
        // Verify verse 1 is included (this was the bug)
        expect(verseNumbers.has(1)).toBe(true)
    })

    test.concurrent("parses all 27 verses in NIV James 1", async () => {
        const result = await cachedParseApiBibleChapter(nivJames1Html, "niv")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verseNumbers = new Set<number>()
        for (const p of paragraphs) {
            for (const verse of p.nodes) {
                verseNumbers.add(verse.verse.verse)
            }
        }

        expect(verseNumbers.size).toBe(27)
        // Verify verse 1 is included (this was the bug)
        expect(verseNumbers.has(1)).toBe(true)
    })
})

describe("Poetry paragraph merging", () => {
    // Poetry lines (q1, q2, etc.) should be merged into single paragraphs
    // to avoid excessive margin between lines. Stanza breaks (<p class="b">)
    // and Hebrew letter headers (<p class="qa">) should create new paragraphs.

    const nivPsalm23Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/niv/psalm_23.html",
        ),
        "utf8",
    )

    const nivPsalm119Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/niv/psalm_119.html",
        ),
        "utf8",
    )

    test.concurrent("Psalm 23 merges poetry lines into few paragraphs (not one per line)", async () => {
        const psalm23Result = await cachedParseApiBibleChapter(
            nivPsalm23Html,
            "niv",
        )
        const paragraphs = psalm23Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Should have far fewer paragraphs than 20 (which was one per line)
        // Stanza break after verse 4 creates 2 paragraphs
        expect(paragraphs.length).toBeLessThanOrEqual(3)
        expect(paragraphs.length).toBeGreaterThanOrEqual(1)
    })

    test.concurrent("Psalm 23 respects stanza breaks", async () => {
        const psalm23Result = await cachedParseApiBibleChapter(
            nivPsalm23Html,
            "niv",
        )
        const paragraphs = psalm23Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Should have 2 paragraphs due to stanza break between v4 and v5
        expect(paragraphs.length).toBe(2)

        // First paragraph should contain verses 1-4
        const firstParagraphVerses = new Set(
            paragraphs[0]!.nodes.map(v => v.verse.verse),
        )
        expect(firstParagraphVerses.has(1)).toBe(true)
        expect(firstParagraphVerses.has(4)).toBe(true)
        expect(firstParagraphVerses.has(5)).toBe(false)

        // Second paragraph should contain verses 5-6
        const secondParagraphVerses = new Set(
            paragraphs[1]!.nodes.map(v => v.verse.verse),
        )
        expect(secondParagraphVerses.has(5)).toBe(true)
        expect(secondParagraphVerses.has(6)).toBe(true)
    })

    test.concurrent("Psalm 23 poetry paragraphs contain newLine elements between lines", async () => {
        const psalm23Result = await cachedParseApiBibleChapter(
            nivPsalm23Html,
            "niv",
        )
        const paragraphs = psalm23Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Each paragraph should have newLine elements between verses
        for (const p of paragraphs) {
            const hasNewLines = p.nodes.some(verse =>
                verse.nodes.some(node => node.type === "newLine"),
            )
            // Paragraphs with multiple verses should have newlines
            if (p.nodes.length > 1) {
                expect(hasNewLines).toBe(true)
            }
        }
    })

    test.concurrent("Psalm 119 splits into sections by Hebrew letter headers", async () => {
        const psalm119Result = await cachedParseApiBibleChapter(
            nivPsalm119Html,
            "niv",
        )
        const paragraphs = psalm119Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Should have 22 paragraphs (one per Hebrew letter section)
        // Each section has 8 verses, 22 sections × 8 = 176 verses
        expect(paragraphs.length).toBe(22)
    })

    test.concurrent("Psalm 119 each section contains 8 verses", async () => {
        const psalm119Result = await cachedParseApiBibleChapter(
            nivPsalm119Html,
            "niv",
        )
        const paragraphs = psalm119Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Each section should have exactly 8 unique verse numbers
        for (const p of paragraphs) {
            const verseNumbers = new Set(p.nodes.map(v => v.verse.verse))
            expect(verseNumbers.size).toBe(8)
        }
    })

    test.concurrent("Psalm 119 Hebrew letter headers are converted to h4", async () => {
        const psalm119Result = await cachedParseApiBibleChapter(
            nivPsalm119Html,
            "niv",
        )
        const h4Headers = psalm119Result.nodes.filter(n => n.type === "h4")

        // Should have 22 Hebrew letter headers (Aleph through Tav)
        expect(h4Headers.length).toBe(22)
    })

    test.concurrent("all 6 verses in Psalm 23 are preserved after merging", async () => {
        const psalm23Result = await cachedParseApiBibleChapter(
            nivPsalm23Html,
            "niv",
        )
        const paragraphs = psalm23Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const allVerseNumbers = new Set<number>()
        for (const p of paragraphs) {
            for (const v of p.nodes) {
                allVerseNumbers.add(v.verse.verse)
            }
        }

        expect(allVerseNumbers.size).toBe(6)
        for (let i = 1; i <= 6; i++) {
            expect(allVerseNumbers.has(i)).toBe(true)
        }
    })

    test.concurrent("all 176 verses in Psalm 119 are preserved after merging", async () => {
        const psalm119Result = await cachedParseApiBibleChapter(
            nivPsalm119Html,
            "niv",
        )
        const paragraphs = psalm119Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const allVerseNumbers = new Set<number>()
        for (const p of paragraphs) {
            for (const v of p.nodes) {
                allVerseNumbers.add(v.verse.verse)
            }
        }

        expect(allVerseNumbers.size).toBe(176)
        for (let i = 1; i <= 176; i++) {
            expect(allVerseNumbers.has(i)).toBe(true)
        }
    })
})

describe("Poetry indentation", () => {
    // API.Bible uses q1/q2 classes to indicate indentation levels.
    // q1 = first level (2 spaces), q2 = second level (4 spaces)
    // These should be preserved as leading space atoms.

    const nivGen1Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/niv/genesis_1.html",
        ),
        "utf8",
    )

    const nivPsalm23Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/niv/psalm_23.html",
        ),
        "utf8",
    )

    /**
     * Count leading space atoms after verse number (or at start if no verse number)
     */
    function countLeadingSpaces(nodes: Array<{ type: string }>): number {
        let count = 0
        let afterVerseNumber = false

        for (const node of nodes) {
            if (node.type === "verseNumber") {
                afterVerseNumber = true
                continue
            }
            if (node.type === "space" && afterVerseNumber) {
                count++
            } else if (node.type !== "space") {
                break
            }
        }

        // If no verse number, count from start
        if (!afterVerseNumber) {
            count = 0
            for (const node of nodes) {
                if (node.type === "space") {
                    count++
                } else {
                    break
                }
            }
        }

        return count
    }

    test.concurrent("Genesis 1:27 first line (q1) has 2 leading spaces", async () => {
        const result = await cachedParseApiBibleChapter(nivGen1Html, "niv")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Find verse 27 first occurrence (has verse number)
        const verse27 = paragraphs
            .flatMap(p => p.nodes)
            .find(
                v =>
                    v.verse.verse === 27 &&
                    v.nodes.some(n => n.type === "verseNumber"),
            )

        expect(verse27).toBeDefined()
        expect(countLeadingSpaces(verse27!.nodes)).toBe(2)
    })

    test.concurrent("Genesis 1:27 continuation lines (q2) have 4 leading spaces after newLine", async () => {
        const result = await cachedParseApiBibleChapter(nivGen1Html, "niv")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Find verse 27 (now merged into a single section)
        const verse27 = paragraphs
            .flatMap(p => p.nodes)
            .find(v => v.verse.verse === 27)

        expect(verse27).toBeDefined()
        const nodes = verse27!.nodes

        // Find newLines and check indentation after each one
        const newLineIndices = nodes
            .map((n, i) => (n.type === "newLine" ? i : -1))
            .filter(i => i >= 0)

        expect(newLineIndices.length).toBe(2) // 3 poetry lines = 2 newLines

        // Check each continuation line has spaces after newLine (q2 indentation)
        for (const newLineIdx of newLineIndices) {
            let spaceCount = 0
            for (let i = newLineIdx + 1; i < nodes.length; i++) {
                if (nodes[i]!.type === "space") {
                    spaceCount++
                } else {
                    break
                }
            }
            // q2 = 4 spaces for continuation lines
            expect(spaceCount).toBe(4)
        }
    })

    test.concurrent("Psalm 23 verse 1 (q1) has 2 leading spaces", async () => {
        const result = await cachedParseApiBibleChapter(nivPsalm23Html, "niv")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verse1 = paragraphs
            .flatMap(p => p.nodes)
            .find(
                v =>
                    v.verse.verse === 1 &&
                    v.nodes.some(n => n.type === "verseNumber"),
            )

        expect(verse1).toBeDefined()
        expect(countLeadingSpaces(verse1!.nodes)).toBe(2)
    })

    test.concurrent("Psalm 23 has mix of q1 (2 spaces) and q2 (4 spaces) indentation", async () => {
        const result = await cachedParseApiBibleChapter(nivPsalm23Html, "niv")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const allVerses = paragraphs.flatMap(p => p.nodes)
        const indentCounts = allVerses.map(v => countLeadingSpaces(v.nodes))

        // Should have both 2-space and 4-space indentation
        expect(indentCounts.some(c => c === 2)).toBe(true)
        expect(indentCounts.some(c => c === 4)).toBe(true)
    })

    test.concurrent("non-poetry paragraphs have no leading indent spaces", async () => {
        const result = await cachedParseApiBibleChapter(nivGen1Html, "niv")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Find a non-poetry paragraph (verse 1)
        const verse1 = paragraphs
            .flatMap(p => p.nodes)
            .find(
                v =>
                    v.verse.verse === 1 &&
                    v.nodes.some(n => n.type === "verseNumber"),
            )

        expect(verse1).toBeDefined()
        // Verse 1 is in a regular paragraph, should have 0 leading spaces
        expect(countLeadingSpaces(verse1!.nodes)).toBe(0)
    })
})

describe("Speaker labels and section headers (Song of Solomon)", () => {
    // Song of Solomon has:
    // - Speaker labels (sp class): "She", "Friends", "He"
    // - Section headers (s class): "The Banquet", "Solomon's Love for a Shulamite Girl"
    // These should be parsed as h4 headings, not typeable content

    const nivSongHtml = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/niv/song_of_solomon_1.html",
        ),
        "utf8",
    )

    const nkjvSongHtml = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nkjv/song_of_solomon_1.html",
        ),
        "utf8",
    )

    test.concurrent("speaker labels are parsed as h4 headings (NIV)", async () => {
        const result = await cachedParseApiBibleChapter(nivSongHtml, "niv")

        const h4Headers = result.nodes.filter(n => n.type === "h4")

        // NIV Song of Solomon 1 has several speaker labels
        expect(h4Headers.length).toBeGreaterThan(0)
    })

    test.concurrent("speaker labels contain expected text (NIV)", async () => {
        const result = await cachedParseApiBibleChapter(nivSongHtml, "niv")

        const h4Headers = result.nodes.filter(n => n.type === "h4")
        const speakerTexts = h4Headers.map(h =>
            h.type === "h4" ? h.text.trim() : "",
        )

        // Should have speakers like "She", "Friends", "He"
        expect(speakerTexts.some(t => t === "She")).toBe(true)
        expect(speakerTexts.some(t => t === "Friends")).toBe(true)
        expect(speakerTexts.some(t => t === "He")).toBe(true)
    })

    test.concurrent("section headers are parsed as h4 headings (NKJV)", async () => {
        const result = await cachedParseApiBibleChapter(nkjvSongHtml, "nkjv")

        const h4Headers = result.nodes.filter(n => n.type === "h4")
        const headerTexts = h4Headers.map(h =>
            h.type === "h4" ? h.text.trim() : "",
        )

        // NKJV has section headers like "The Banquet" and speaker labels like "The Shulamite"
        expect(headerTexts.some(t => t === "The Banquet")).toBe(true)
        // Note: NKJV uses curly apostrophe (') not straight apostrophe (')
        expect(
            headerTexts.some(t => t.includes("Solomon") && t.includes("Love")),
        ).toBe(true)
    })

    test('speaker labels like "The Shulamite" are parsed as h4 (NKJV)', async () => {
        const result = await cachedParseApiBibleChapter(nkjvSongHtml, "nkjv")

        const h4Headers = result.nodes.filter(n => n.type === "h4")
        const headerTexts = h4Headers.map(h =>
            h.type === "h4" ? h.text.trim() : "",
        )

        // NKJV uses qa class for speaker labels
        expect(headerTexts.some(t => t === "The Shulamite")).toBe(true)
        expect(headerTexts.some(t => t === "The Daughters of Jerusalem")).toBe(
            true,
        )
        expect(headerTexts.some(t => t === "The Beloved")).toBe(true)
    })

    test.concurrent("speaker labels are not included in paragraph text (NIV)", async () => {
        const result = await cachedParseApiBibleChapter(nivSongHtml, "niv")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Check that no paragraph contains just "She", "Friends", or "He"
        for (const p of paragraphs) {
            const text = p.text.trim()
            expect(text).not.toBe("She")
            expect(text).not.toBe("Friends")
            expect(text).not.toBe("He")
        }
    })

    test.concurrent("section headers are not included in paragraph text (NKJV)", async () => {
        const result = await cachedParseApiBibleChapter(nkjvSongHtml, "nkjv")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Check that no paragraph contains section headers or speaker labels
        for (const p of paragraphs) {
            const text = p.text.trim()
            expect(text).not.toBe("The Banquet")
            expect(text).not.toBe("Solomon's Love for a Shulamite Girl")
            expect(text).not.toBe("The Shulamite")
            expect(text).not.toBe("The Daughters of Jerusalem")
            expect(text).not.toBe("The Beloved")
        }
    })

    test.concurrent("all 17 verses are still parsed correctly", async () => {
        const result = await cachedParseApiBibleChapter(nivSongHtml, "niv")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const allVerseNumbers = new Set<number>()
        for (const p of paragraphs) {
            for (const v of p.nodes) {
                allVerseNumbers.add(v.verse.verse)
            }
        }

        expect(allVerseNumbers.size).toBe(17)
        for (let i = 1; i <= 17; i++) {
            expect(allVerseNumbers.has(i)).toBe(true)
        }
    })

    test.concurrent("verse 4 sections are split by speaker changes (h4 headers)", async () => {
        // NIV Song 1:4 has speaker changes (She -> Friends -> She)
        // Each speaker section creates a separate verse section (3 total)
        const result = await cachedParseApiBibleChapter(nivSongHtml, "niv")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verse4Sections = paragraphs
            .flatMap(p => p.nodes)
            .filter(v => v.verse.verse === 4)

        // Should be 3 sections (one per speaker section), not 5+ raw paragraphs
        expect(verse4Sections.length).toBe(3)

        // First section should have verse number, others should be hanging
        expect(verse4Sections[0]!.metadata.hangingVerse).toBe(false)
        expect(verse4Sections[1]!.metadata.hangingVerse).toBe(true)
        expect(verse4Sections[2]!.metadata.hangingVerse).toBe(true)
    })

    test.concurrent("same-verse poetry lines within speaker section are merged", async () => {
        // NIV Song 1:2-3 spans multiple poetry lines with same speaker (She)
        // They should be merged within the same paragraph
        const result = await cachedParseApiBibleChapter(nivSongHtml, "niv")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Find the paragraph containing verses 2, 3, 4 (first speaker section)
        const sheParagraph = paragraphs.find(p =>
            p.nodes.some(v => v.verse.verse === 2),
        )

        expect(sheParagraph).toBeDefined()

        // Verse 2 should be a single merged section (not 2 separate)
        const verse2Sections = sheParagraph!.nodes.filter(
            v => v.verse.verse === 2,
        )
        expect(verse2Sections.length).toBe(1)

        // The merged verse 2 should have a newLine (from merging 2 poetry lines)
        const newLines = verse2Sections[0]!.nodes.filter(
            n => n.type === "newLine",
        )
        expect(newLines.length).toBeGreaterThan(0)
    })
})

// ============================================================================
// LUKE 19:38 - POETRY CONTINUATION WITH SMALL CAPS (NASB)
// ============================================================================

describe("Luke 19:38 poetry continuation (NASB)", () => {
    // Luke 19:38 in NASB has:
    // - Verse 38 starts in a regular paragraph with "38 shouting:"
    // - Then two <p class="q" data-vid="LUK 19:38"> poetry lines follow:
    //   1. "Blessed is the King, the One who comes in the name of the Lord;
    //   2. Peace in heaven and glory in the highest!"
    // - The text contains <span class="sc"> small caps elements
    // - Both poetry lines should be typeable as part of verse 38

    const nasbLuke19Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nasb/luke_19.html",
        ),
        "utf8",
    )

    test.concurrent("verse 38 is parsed correctly with all content", async () => {
        const result = await cachedParseApiBibleChapter(nasbLuke19Html, "nasb")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Find all verse 38 sections
        const verse38Sections = paragraphs
            .flatMap(p => p.nodes)
            .filter(v => v.verse.verse === 38)

        expect(verse38Sections.length).toBeGreaterThan(0)
    })

    test('verse 38 contains "Blessed" text (small caps merged correctly)', async () => {
        const result = await cachedParseApiBibleChapter(nasbLuke19Html, "nasb")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verse38Sections = paragraphs
            .flatMap(p => p.nodes)
            .filter(v => v.verse.verse === 38)

        // Get all words from verse 38
        const allWords = verse38Sections.flatMap(section =>
            section.nodes.filter((n): n is Word => n.type === "word"),
        )
        const wordTexts = allWords.map(w => w.letters.join("").trim())

        // Small caps words should be merged (not split like "B" + "lessed")
        // The actual word includes the opening quote: "Blessed
        expect(wordTexts.some(w => /blessed/i.test(w))).toBe(true)
        expect(wordTexts).not.toContain('"B')
        expect(wordTexts).not.toContain("lessed")
        expect(wordTexts.some(w => /one/i.test(w))).toBe(true)
        expect(wordTexts).not.toContain("O")
        expect(wordTexts).not.toContain("ne")
        expect(wordTexts.some(w => /lord/i.test(w))).toBe(true)
        expect(wordTexts).not.toContain("L")
        expect(wordTexts).not.toContain("ord;")
    })

    test('verse 38 contains "Peace" text (second poetry line)', async () => {
        const result = await cachedParseApiBibleChapter(nasbLuke19Html, "nasb")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verse38Sections = paragraphs
            .flatMap(p => p.nodes)
            .filter(v => v.verse.verse === 38)

        const allText = verse38Sections.map(v => v.text).join(" ")

        // The second poetry line "Peace in heaven..." must be included
        expect(allText).toContain("Peace")
        expect(allText).toContain("heaven")
        expect(allText).toContain("highest")
    })

    test.concurrent("verse 38 has no empty word atoms", async () => {
        const result = await cachedParseApiBibleChapter(nasbLuke19Html, "nasb")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verse38Sections = paragraphs
            .flatMap(p => p.nodes)
            .filter(v => v.verse.verse === 38)

        for (const section of verse38Sections) {
            for (const node of section.nodes) {
                if (node.type === "word") {
                    const wordText = node.letters.join("").trim()
                    expect(wordText.length).toBeGreaterThan(0)
                }
            }
        }
    })

    test.concurrent("all verse 38 words are typeable (have letters)", async () => {
        const result = await cachedParseApiBibleChapter(nasbLuke19Html, "nasb")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verse38Sections = paragraphs
            .flatMap(p => p.nodes)
            .filter(v => v.verse.verse === 38)

        const allWords = verse38Sections.flatMap(section =>
            section.nodes.filter((n): n is Word => n.type === "word"),
        )

        // Each word should have at least one letter character
        for (const word of allWords) {
            const hasLetter = word.letters.some(letter =>
                /[a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/.test(letter),
            )
            expect(hasLetter).toBe(true)
        }
    })

    test.concurrent("poetry lines are merged (verse 38 has newLine atoms)", async () => {
        const result = await cachedParseApiBibleChapter(nasbLuke19Html, "nasb")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verse38Sections = paragraphs
            .flatMap(p => p.nodes)
            .filter(v => v.verse.verse === 38)

        // At least one section should have newLine atoms (from merging poetry lines)
        const hasNewLine = verse38Sections.some(section =>
            section.nodes.some(n => n.type === "newLine"),
        )

        expect(hasNewLine).toBe(true)
    })

    test.concurrent("hanging verse metadata.length includes all merged words", async () => {
        const result = await cachedParseApiBibleChapter(nasbLuke19Html, "nasb")

        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Find the hanging verse section (poetry content)
        const hangingSection = paragraphs
            .flatMap(p => p.nodes)
            .find(v => v.verse.verse === 38 && v.metadata.hangingVerse === true)

        expect(hangingSection).toBeDefined()
        if (!hangingSection) return

        // Count actual words
        const actualWordCount = hangingSection.nodes.filter(
            (n): n is Word => n.type === "word",
        ).length

        // metadata.length should match actual word count
        expect(hangingSection.metadata.length).toBe(actualWordCount)

        // Should include words from both poetry lines (22 words total)
        // Standalone punctuation like ; is merged with the previous word
        expect(actualWordCount).toBe(22)
    })
})

// ============================================================================
// COMPREHENSIVE PARAMETERIZED TESTS FOR ALL TRANSLATIONS
// ============================================================================

const TRANSLATIONS: Exclude<Translation, "esv">[] = [
    "bsb",
    "nlt",
    "niv",
    "csb",
    "nkjv",
    "nasb",
    "ntv",
    "msg",
]

const CHAPTERS: Array<{
    book: string
    chapter: number
    expectedVerses: number
    bookSlug: string
}> = [
    {
        book: "genesis",
        chapter: 1,
        expectedVerses: 31,
        bookSlug: "genesis",
    },
    {
        book: "exodus",
        chapter: 20,
        expectedVerses: 26,
        bookSlug: "exodus",
    },
    {
        book: "psalm",
        chapter: 23,
        expectedVerses: 6,
        bookSlug: "psalm",
    },
    {
        book: "psalm",
        chapter: 119,
        expectedVerses: 176,
        bookSlug: "psalm",
    },
    {
        book: "proverbs",
        chapter: 3,
        expectedVerses: 35,
        bookSlug: "proverbs",
    },
    {
        book: "isaiah",
        chapter: 53,
        expectedVerses: 12,
        bookSlug: "isaiah",
    },
    {
        book: "matthew",
        chapter: 5,
        expectedVerses: 48,
        bookSlug: "matthew",
    },
    {
        book: "john",
        chapter: 1,
        expectedVerses: 51,
        bookSlug: "john",
    },
    {
        book: "romans",
        chapter: 1,
        expectedVerses: 32,
        bookSlug: "romans",
    },
    {
        book: "romans",
        chapter: 8,
        expectedVerses: 39,
        bookSlug: "romans",
    },
    {
        book: "james",
        chapter: 1,
        expectedVerses: 27,
        bookSlug: "james",
    },
    {
        book: "revelation",
        chapter: 21,
        expectedVerses: 27,
        bookSlug: "revelation",
    },
    {
        book: "song_of_solomon",
        chapter: 1,
        expectedVerses: 17,
        bookSlug: "song_of_solomon",
    },
    {
        book: "luke",
        chapter: 19,
        expectedVerses: 48,
        bookSlug: "luke",
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
                if (node.type === "word") {
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
        if (letters[i] === "\n") {
            return true
        }
    }
    return false
}

/**
 * Checks for double spaces in the parsed inline nodes.
 * Allows multiple consecutive spaces at the start of a verse (after verse number)
 * for poetry indentation, but not elsewhere.
 */
function hasDoubleSpaces(paragraphs: Paragraph[]): boolean {
    for (const p of paragraphs) {
        for (const verse of p.nodes) {
            const nodes = verse.nodes
            let lastWasSpace = false
            let inLeadingSpaces = true // Track if we're in leading spaces (after verse number or newLine)

            for (const node of nodes) {
                if (node.type === "verseNumber") {
                    // After verse number, we may have leading indent spaces
                    inLeadingSpaces = true
                    lastWasSpace = false
                } else if (node.type === "newLine") {
                    // After newLine, next line may have leading indent spaces
                    inLeadingSpaces = true
                    lastWasSpace = false
                } else if (node.type === "space") {
                    if (lastWasSpace && !inLeadingSpaces) {
                        return true // Double space not at start of line
                    }
                    lastWasSpace = true
                } else {
                    // Hit non-space content, no longer in leading spaces
                    inLeadingSpaces = false
                    lastWasSpace = false
                }
            }
        }
    }
    return false
}

/**
 * Checks that verse numbers are followed by valid content (word or indent spaces).
 * For poetry (block-indent paragraphs), leading spaces are allowed for indentation.
 * For regular paragraphs, verse numbers should be followed directly by words.
 */
function verseNumbersFollowedByValidContent(paragraphs: Paragraph[]): boolean {
    for (const p of paragraphs) {
        const isPoetry = p.metadata.blockIndent

        for (const verse of p.nodes) {
            const nodes = verse.nodes
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i]
                if (node && node.type === "verseNumber") {
                    const nextNode = nodes[i + 1]
                    // After verse number should be:
                    // - For poetry: spaces (indent) or word
                    // - For prose: word
                    if (nextNode && nextNode.type === "space" && !isPoetry) {
                        return false // Non-poetry should not have space atom after verse number
                    }
                    // Check that there IS content after verse number
                    if (!nextNode) {
                        return false // Verse number at end with no content
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
            if (typeof verseNum === "number") {
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
                if (node.type === "word") {
                    const word = node.letters.join("")
                    // Check if word contains no letters/numbers (just punctuation/whitespace)
                    if (!/[a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/.test(word)) {
                        // Allow punctuation that includes quotes, parentheses, or
                        // standalone punctuation like semicolons/colons/commas/periods/question/exclamation
                        // These are needed for proper rendering of quoted/parenthetical text
                        const hasAllowedPunct =
                            /[\u0022\u0027\u201C\u201D\u2018\u2019()[\];:,.?!]/.test(
                                word,
                            )
                        if (!hasAllowedPunct) {
                            problems.push(word)
                        }
                    }
                }
            }
        }
    }
    return problems
}

// Load all fixtures into memory once
const fixtures = new Map<string, string>()
const responsesDir = path.join(process.cwd(), "src/server/api-bible/responses")

for (const translation of TRANSLATIONS) {
    for (const chapter of CHAPTERS) {
        const filePath = path.join(
            responsesDir,
            translation,
            `${chapter.book}_${chapter.chapter}.html`,
        )
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, "utf8")
            fixtures.set(
                `${translation}/${chapter.book}_${chapter.chapter}`,
                content,
            )
        }
    }
}

describe.each(TRANSLATIONS)("Translation: %s", translation => {
    describe.each(CHAPTERS)(
        "$book $chapter",
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

            test("parses without throwing", async () => {
                await expect(
                    cachedParseApiBibleChapter(html, translation),
                ).resolves.toBeDefined()
            })

            test("has correct firstVerse metadata", async () => {
                const result = await cachedParseApiBibleChapter(
                    html,
                    translation,
                )

                expect(result.firstVerse).toBeDefined()
                expect(result.firstVerse.book).toBe(bookSlug)
                expect(result.firstVerse.chapter).toBe(chapter)
                expect(result.firstVerse.translation).toBe(translation)
            })

            test("verse number text includes trailing space (matches ESV format)", async () => {
                const result = await cachedParseApiBibleChapter(
                    html,
                    translation,
                )
                const paragraphs = result.nodes.filter(
                    (n): n is Paragraph => n.type === "paragraph",
                )

                // Check all verse numbers have trailing space in their text
                const verseNumbersWithoutTrailingSpace: string[] = []
                for (const p of paragraphs) {
                    for (const verse of p.nodes) {
                        const verseNumNode = verse.nodes.find(
                            n => n.type === "verseNumber",
                        )
                        if (
                            verseNumNode &&
                            verseNumNode.type === "verseNumber"
                        ) {
                            if (!verseNumNode.text.endsWith(" ")) {
                                verseNumbersWithoutTrailingSpace.push(
                                    `v${verseNumNode.verse}: "${verseNumNode.text}"`,
                                )
                            }
                        }
                    }
                }

                if (verseNumbersWithoutTrailingSpace.length > 0) {
                    throw new Error(
                        `Verse numbers without trailing space: ${verseNumbersWithoutTrailingSpace.slice(0, 5).join(", ")}`,
                    )
                }
                expect(verseNumbersWithoutTrailingSpace).toHaveLength(0)
            })

            test("parses all expected verses", async () => {
                const result = await cachedParseApiBibleChapter(
                    html,
                    translation,
                )
                const paragraphs = result.nodes.filter(
                    (n): n is Paragraph => n.type === "paragraph",
                )
                const verseNumbers = getUniqueVerseNumbers(paragraphs)

                // MSG often combines verses (e.g., "1-2", "3-5"), so we check minimum coverage
                if (translation === "msg") {
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

            test("has no embedded newlines in words", async () => {
                const result = await cachedParseApiBibleChapter(
                    html,
                    translation,
                )
                const paragraphs = result.nodes.filter(
                    (n): n is Paragraph => n.type === "paragraph",
                )
                const words = getAllWords(paragraphs)
                const wordsWithNewlines = words.filter(hasEmbeddedNewline)

                if (wordsWithNewlines.length > 0) {
                    const examples = wordsWithNewlines
                        .slice(0, 3)
                        .map(w => `"${w.letters.join("")}"`)
                        .join(", ")
                    throw new Error(
                        `Found ${wordsWithNewlines.length} word(s) with embedded newlines: ${examples}`,
                    )
                }

                expect(wordsWithNewlines).toHaveLength(0)
            })

            test("has no double spaces", async () => {
                const result = await cachedParseApiBibleChapter(
                    html,
                    translation,
                )
                const paragraphs = result.nodes.filter(
                    (n): n is Paragraph => n.type === "paragraph",
                )

                expect(hasDoubleSpaces(paragraphs)).toBe(false)
            })

            test("has no punctuation-only words", async () => {
                const result = await cachedParseApiBibleChapter(
                    html,
                    translation,
                )
                const paragraphs = result.nodes.filter(
                    (n): n is Paragraph => n.type === "paragraph",
                )

                const problems = getPunctuationOnlyWords(paragraphs)
                if (problems.length > 0) {
                    throw new Error(
                        `Found ${problems.length} punctuation-only word(s): ${problems
                            .slice(0, 5)
                            .map(w => `"${w}"`)
                            .join(", ")}`,
                    )
                }
                expect(problems).toHaveLength(0)
            })

            test("verse numbers are followed by words not space atoms", async () => {
                const result = await cachedParseApiBibleChapter(
                    html,
                    translation,
                )
                const paragraphs = result.nodes.filter(
                    (n): n is Paragraph => n.type === "paragraph",
                )

                // Only check if there are verse numbers with nodes following
                const hasVerseNumbers = paragraphs.some(p =>
                    p.nodes.some(v =>
                        v.nodes.some(n => n.type === "verseNumber"),
                    ),
                )

                if (hasVerseNumbers) {
                    expect(verseNumbersFollowedByValidContent(paragraphs)).toBe(
                        true,
                    )
                }
            })

            test("generates valid prev/next chapter links", async () => {
                const result = await cachedParseApiBibleChapter(
                    html,
                    translation,
                )

                // Genesis 1 should have no prev
                if (bookSlug === "genesis" && chapter === 1) {
                    expect(result.prevChapter).toBeNull()
                }

                // Revelation 21 should have next pointing to 22
                if (bookSlug === "revelation" && chapter === 21) {
                    expect(result.nextChapter).toBeDefined()
                    expect(result.nextChapter?.url).toBe("revelation_22")
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

            test("produces non-empty verse text", async () => {
                const result = await cachedParseApiBibleChapter(
                    html,
                    translation,
                )
                const paragraphs = result.nodes.filter(
                    (n): n is Paragraph => n.type === "paragraph",
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

// ============================================================================
// LUKE 19 NASB - SPECIFIC REGRESSION TESTS
// ============================================================================
// Issue: Verse 38 has poetry continuation paragraphs that weren't typeable.
// The verse starts in a regular paragraph ("shouting:") then continues in
// poetry lines ("Blessed is the King..." and "Peace in heaven...").

describe("Luke 19 NASB - Poetry continuation typing", () => {
    const nasbLuke19Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nasb/luke_19.html",
        ),
        "utf8",
    )

    test.concurrent("parses all 48 verses", async () => {
        const luke19Result = await cachedParseApiBibleChapter(
            nasbLuke19Html,
            "nasb",
        )
        const paragraphs = luke19Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verseNumbers = new Set<number>()
        for (const p of paragraphs) {
            for (const v of p.nodes) {
                verseNumbers.add(v.verse.verse)
            }
        }

        expect(verseNumbers.size).toBe(48)
        for (let i = 1; i <= 48; i++) {
            expect(verseNumbers.has(i)).toBe(true)
        }
    })

    test.concurrent("verse 38 has all content including poetry continuation", async () => {
        const luke19Result = await cachedParseApiBibleChapter(
            nasbLuke19Html,
            "nasb",
        )
        const paragraphs = luke19Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Find all verse 38 sections
        const verse38Sections = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 38),
        )

        // Should have content from "shouting:" AND the poetry lines
        const allText = verse38Sections.map(v => v.text).join(" ")
        expect(allText).toContain("shouting")
        expect(allText).toMatch(/blessed/i)
        expect(allText).toContain("King")
        expect(allText).toContain("Peace")
        expect(allText).toContain("heaven")
        expect(allText).toContain("glory")
    })

    test.concurrent("all verse 38 sections have typeable words", async () => {
        const luke19Result = await cachedParseApiBibleChapter(
            nasbLuke19Html,
            "nasb",
        )
        const paragraphs = luke19Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Find all verse 38 sections
        const verse38Sections = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 38),
        )

        // Each section should have at least one word
        for (const section of verse38Sections) {
            const words = section.nodes.filter(
                (n): n is Word => n.type === "word",
            )
            expect(words.length).toBeGreaterThan(0)
        }
    })

    test.concurrent("verse 38 poetry continuation is properly typed as hanging verse", async () => {
        const luke19Result = await cachedParseApiBibleChapter(
            nasbLuke19Html,
            "nasb",
        )
        const paragraphs = luke19Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Find all verse 38 sections
        const verse38Sections = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 38),
        )

        // First section should not be a hanging verse (has verse number)
        expect(verse38Sections[0]?.metadata.hangingVerse).toBe(false)

        // If there are continuation sections, they should be hanging verses
        for (let i = 1; i < verse38Sections.length; i++) {
            expect(verse38Sections[i]?.metadata.hangingVerse).toBe(true)
        }
    })

    test.concurrent("can type through entire verse 38 including all poetry lines", async () => {
        const luke19Result = await cachedParseApiBibleChapter(
            nasbLuke19Html,
            "nasb",
        )
        const paragraphs = luke19Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Collect all words for verse 38 in order
        const verse38Words: Word[] = []
        for (const p of paragraphs) {
            for (const verse of p.nodes) {
                if (verse.verse.verse === 38) {
                    for (const node of verse.nodes) {
                        if (node.type === "word") {
                            verse38Words.push(node)
                        }
                    }
                }
            }
        }

        // Should have words
        expect(verse38Words.length).toBeGreaterThan(5)

        // Verify key words from all parts of verse 38 are present
        // Note: "Blessed" is now correctly merged with small caps spans
        const allLetters = verse38Words.map(w => w.letters.join("")).join(" ")
        expect(allLetters).toContain("shouting")
        expect(allLetters).toMatch(/blessed/i)
        expect(allLetters).toContain("King")
        expect(allLetters).toContain("Peace")
        expect(allLetters).toContain("heaven")
    })

    test.concurrent("no verse 38 section has empty nodes array", async () => {
        const luke19Result = await cachedParseApiBibleChapter(
            nasbLuke19Html,
            "nasb",
        )
        const paragraphs = luke19Result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Find all verse 38 sections
        const verse38Sections = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 38),
        )

        for (const section of verse38Sections) {
            expect(section.nodes.length).toBeGreaterThan(0)
        }
    })
})

// ============================================================================
// LUKE 7:5-10 NASB - SPACING AND QUOTE ISSUES
// ============================================================================
describe("Luke 7:5-10 NASB - Spacing and quote rendering", () => {
    const nasbLuke7Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nasb/luke_7.html",
        ),
        "utf8",
    )

    test.concurrent("parses Luke 7 successfully", async () => {
        const luke7Result = await cachedParseApiBibleChapter(
            nasbLuke7Html,
            "nasb",
        )
        expect(luke7Result.nodes.length).toBeGreaterThan(0)
    })

    test.concurrent("verse 5 text is correct", async () => {
        const luke7Result = await cachedParseApiBibleChapter(
            nasbLuke7Html,
            "nasb",
        )
        const result = luke7Result // cachedParseApiBibleChapter(nasbLuke7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse5 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 5),
        )

        expect(verse5.length).toBeGreaterThan(0)
        const verse5Text = verse5.map(v => v.text).join("")
        expect(verse5Text).toContain(
            "for he loves our nation, and it was he who built us our synagogue.",
        )
    })

    test('verse 6 has opening quote before "Lord"', async () => {
        const luke7Result = await cachedParseApiBibleChapter(
            nasbLuke7Html,
            "nasb",
        )
        const result = luke7Result // cachedParseApiBibleChapter(nasbLuke7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse6 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 6),
        )

        expect(verse6.length).toBeGreaterThan(0)
        const verse6Text = verse6.map(v => v.text).join("")

        // Should have: saying to Him, [quote]Lord, do not trouble
        // Check that there's a quote character (any quote) before Lord
        expect(verse6Text).toMatch(/saying to Him, [\u0022\u201C]Lord/)
        expect(verse6Text).toMatch(/[\u0022\u201C]Lord, do not trouble/)
    })

    test('verse 6 opening quote is grouped with "Lord" as one word', async () => {
        const luke7Result = await cachedParseApiBibleChapter(
            nasbLuke7Html,
            "nasb",
        )
        const result = luke7Result // cachedParseApiBibleChapter(nasbLuke7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse6 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 6),
        )

        // Get all words from verse 6
        const words = verse6.flatMap(v =>
            v.nodes.filter((n): n is Word => n.type === "word"),
        )

        // Find the word that contains "Lord"
        const lordWord = words.find(w => w.letters.join("").includes("Lord"))
        expect(lordWord).toBeDefined()

        // The opening quote should be part of the same word as "Lord"
        // i.e., the word should be '"Lord, ' not just 'Lord, '
        const lordWordText = lordWord!.letters.join("")

        // Should start with a quote character
        expect(lordWordText).toMatch(/^[\u0022\u201C]Lord/)
    })

    test('verse 7 "I did" is rendered with proper spacing', async () => {
        const luke7Result = await cachedParseApiBibleChapter(
            nasbLuke7Html,
            "nasb",
        )
        const result = luke7Result // cachedParseApiBibleChapter(nasbLuke7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse7 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 7),
        )

        expect(verse7.length).toBeGreaterThan(0)
        const verse7Text = verse7.map(v => v.text).join("")

        // Should have: for that reason I did not even consider
        expect(verse7Text).toContain("reason I did not")
        expect(verse7Text).toContain("I did not even consider")
    })

    test('verse 9 "I say" is rendered with proper spacing', async () => {
        const luke7Result = await cachedParseApiBibleChapter(
            nasbLuke7Html,
            "nasb",
        )
        const result = luke7Result // cachedParseApiBibleChapter(nasbLuke7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse9 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 9),
        )

        expect(verse9.length).toBeGreaterThan(0)
        const verse9Text = verse9.map(v => v.text).join("")

        // Should have: was following Him, [quote]I say to you,
        // Check that there's a quote character (any quote) before "I say"
        expect(verse9Text).toMatch(/Him, [\u0022\u201C]I say to you/)
        expect(verse9Text).toMatch(/[\u0022\u201C]I say to you,/)
    })

    test.concurrent("verse 8 ending has no space before closing quote", async () => {
        const luke7Result = await cachedParseApiBibleChapter(
            nasbLuke7Html,
            "nasb",
        )
        const result = luke7Result // cachedParseApiBibleChapter(nasbLuke7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse8 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 8),
        )

        expect(verse8.length).toBeGreaterThan(0)
        const verse8Text = verse8.map(v => v.text).join("")

        // Should end with: he does it."  (no space before closing quote)
        // Note: Uses curly quote " (U+201D) from the API
        expect(verse8Text).toContain("he does it.\u201D")
        expect(verse8Text).not.toContain("it. \u201D")
        expect(verse8Text).not.toContain('it. "')
    })

    test.concurrent("verses 5-10 full text has proper spacing", async () => {
        const luke7Result = await cachedParseApiBibleChapter(
            nasbLuke7Html,
            "nasb",
        )
        const result = luke7Result // cachedParseApiBibleChapter(nasbLuke7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verses5to10 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse >= 5 && v.verse.verse <= 10),
        )

        const fullText = verses5to10.map(v => v.text).join("")

        // Check key phrases have proper spacing (no "Iam", "Idid", "Isay", etc.)
        expect(fullText).toContain("for I am not worthy")
        expect(fullText).toContain("I did not even consider")
        expect(fullText).toContain("For I also am")
        expect(fullText).toContain("and I say to this one")
        expect(fullText).toMatch(/[\u0022\u201C]I say to you/)
        expect(fullText).toContain("have I found such")

        // Check no merged words
        expect(fullText).not.toContain("Iam ")
        expect(fullText).not.toContain("Idid ")
        expect(fullText).not.toContain("Ialso ")
        expect(fullText).not.toContain("Isay ")
        expect(fullText).not.toContain("Ifound ")
    })
})

// ============================================================================
// PSALM 6 NASB - PILCROW (¶) DECORATION HANDLING
// ============================================================================
describe("Psalm 6 NASB - Pilcrow decoration handling", () => {
    const nasbPsalm6Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nasb/psalm_6.html",
        ),
        "utf8",
    )

    test.concurrent("parses Psalm 6 successfully", async () => {
        const result = await cachedParseApiBibleChapter(nasbPsalm6Html, "nasb")
        expect(result.nodes.length).toBeGreaterThan(0)
        expect(result.firstVerse.book).toBe("psalm")
        expect(result.firstVerse.chapter).toBe(6)
    })

    test.concurrent("pilcrow is parsed as decoration atom", async () => {
        const result = await cachedParseApiBibleChapter(nasbPsalm6Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Find all decoration atoms
        const decorations: Decoration[] = []
        for (const p of paragraphs) {
            for (const verse of p.nodes) {
                for (const node of verse.nodes) {
                    if (node.type === "decoration") {
                        decorations.push(node)
                    }
                }
            }
        }

        // Should have pilcrow decorations
        expect(decorations.length).toBeGreaterThan(0)

        // All should be pilcrow characters
        for (const dec of decorations) {
            expect(dec.text).toBe("¶")
        }
    })

    test.concurrent("decoration atoms are NOT typable", async () => {
        const result = await cachedParseApiBibleChapter(nasbPsalm6Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Find all decoration atoms and verify they are not typable
        for (const p of paragraphs) {
            for (const verse of p.nodes) {
                for (const node of verse.nodes) {
                    if (node.type === "decoration") {
                        expect(isAtomTyped(node)).toBe(false)
                    }
                }
            }
        }
    })

    test('verse 4 has pilcrow decoration before "Return"', async () => {
        const result = await cachedParseApiBibleChapter(nasbPsalm6Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Verse 4 should have pilcrow at start
        const verse4 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 4),
        )
        expect(verse4.length).toBeGreaterThan(0)

        // Check first verse section has decoration
        const verse4Nodes = verse4[0]!.nodes
        const hasDecoration = verse4Nodes.some(n => n.type === "decoration")
        expect(hasDecoration).toBe(true)

        // The text should still contain "Return" (pilcrow not part of typable text)
        const verse4Text = verse4.map(v => v.text).join("")
        expect(verse4Text).toContain("Return")
    })

    test.concurrent("pilcrow does not affect verse text content", async () => {
        const result = await cachedParseApiBibleChapter(nasbPsalm6Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // Get all verse text
        const allText = paragraphs
            .flatMap(p => p.nodes.map(v => v.text))
            .join("")

        // Should NOT contain the pilcrow in the text output (it's a decoration)
        // Note: The verse.text concatenates only typed atoms
        expect(allText).not.toContain("¶")

        // But should contain the actual verse content
        expect(allText).toMatch(/lord/i)
        expect(allText).toContain("Return")
        expect(allText).toContain("weary")
    })

    test.concurrent("verse lengths do not include decoration atoms", async () => {
        const result = await cachedParseApiBibleChapter(nasbPsalm6Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        // For each verse with a decoration, the metadata.length should not count it
        for (const p of paragraphs) {
            for (const verse of p.nodes) {
                const hasDecoration = verse.nodes.some(
                    n => n.type === "decoration",
                )
                if (hasDecoration) {
                    // Count typable atoms
                    const typableCount = verse.nodes.filter(isAtomTyped).length

                    // Verify the length matches typable atoms
                    expect(verse.metadata.length).toBe(typableCount)
                }
            }
        }
    })
})

// ============================================================================
// LUKE 8:21 NASB - CLOSING QUOTE WITH TRAILING SPACE
// ============================================================================
describe("Luke 8:21 NASB - Closing quote completeness", () => {
    const nasbLuke8Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nasb/luke_8.html",
        ),
        "utf8",
    )

    test.concurrent("parses Luke 8 successfully", async () => {
        const result = await cachedParseApiBibleChapter(nasbLuke8Html, "nasb")
        expect(result.nodes.length).toBeGreaterThan(0)
    })

    test.concurrent("verse 21 last word ends with trailing space (is complete)", async () => {
        const result = await cachedParseApiBibleChapter(nasbLuke8Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse21 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 21),
        )

        expect(verse21.length).toBeGreaterThan(0)

        // Get the last word of verse 21
        const verse21Words = verse21.flatMap(v =>
            v.nodes.filter((n): n is Word => n.type === "word"),
        )
        const lastWord = verse21Words[verse21Words.length - 1]
        expect(lastWord).toBeDefined()

        const lastWordText = lastWord!.letters.join("")

        // Should end with closing quote and trailing space
        expect(lastWordText).toMatch(/it\.\u201D\s$/)

        // Verify it's complete (ends with space)
        const lastLetter = lastWord!.letters[lastWord!.letters.length - 1]
        expect(lastLetter).toBe(" ")
    })
})

// ============================================================================
// JOHN 4:2 NASB - PARENTHESES HANDLING
// ============================================================================
describe("John 4:2 NASB - Parentheses handling", () => {
    const nasbJohn4Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nasb/john_4.html",
        ),
        "utf8",
    )

    test.concurrent("parses John 4 successfully", async () => {
        const result = await cachedParseApiBibleChapter(nasbJohn4Html, "nasb")
        expect(result.nodes.length).toBeGreaterThan(0)
    })

    test.concurrent("verse 2 contains closing parenthesis", async () => {
        const result = await cachedParseApiBibleChapter(nasbJohn4Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse2 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 2),
        )

        expect(verse2.length).toBeGreaterThan(0)
        const verse2Text = verse2.map(v => v.text).join("")

        // Should contain closing parenthesis merged with previous word
        expect(verse2Text).toContain(")")
    })

    test.concurrent("verse 53 contains semicolon after closing quote", async () => {
        const result = await cachedParseApiBibleChapter(nasbJohn4Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse53 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 53),
        )

        expect(verse53.length).toBeGreaterThan(0)
        const verse53Text = verse53.map(v => v.text).join("")

        // Should contain the semicolon after the closing quote
        // Note: uses curly quote U+201D
        expect(verse53Text).toContain("alive\u201D;")
    })
})

// ============================================================================
// JOHN 6:1 NASB - OPENING PARENTHESIS HANDLING
// ============================================================================
describe("John 6:1 NASB - Opening parenthesis", () => {
    const nasbJohn6Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nasb/john_6.html",
        ),
        "utf8",
    )

    test.concurrent("parses John 6 successfully", async () => {
        const result = await cachedParseApiBibleChapter(nasbJohn6Html, "nasb")
        expect(result.nodes.length).toBeGreaterThan(0)
    })

    test.concurrent("verse 1 contains opening parenthesis", async () => {
        const result = await cachedParseApiBibleChapter(nasbJohn6Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse1 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 1),
        )

        expect(verse1.length).toBeGreaterThan(0)
        const verse1Text = verse1.map(v => v.text).join("")

        // Should contain both opening and closing parenthesis
        expect(verse1Text).toContain("(")
        expect(verse1Text).toContain(")")

        // Opening paren should be merged with following word "(or"
        const verse1Words = verse1.flatMap(v =>
            v.nodes.filter((n): n is Word => n.type === "word"),
        )
        const openParenWord = verse1Words.find(w => w.letters[0] === "(")
        expect(openParenWord).toBeDefined()
        expect(openParenWord!.letters.join("")).toBe("(or ")
        // Should be complete (ends with space)
        expect(openParenWord!.letters[openParenWord!.letters.length - 1]).toBe(
            " ",
        )
    })

    test('verse 45 "And" is not split up (small caps merge)', async () => {
        const result = await cachedParseApiBibleChapter(nasbJohn6Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse45 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 45),
        )

        expect(verse45.length).toBeGreaterThan(0)
        const verse45Text = verse45.map(v => v.text).join("")

        // Check for split "And" - should NOT have "'A nd" or similar
        // Uses curly quote U+2018
        expect(verse45Text).not.toMatch(/\u2018A\s+nd/)

        // Should have proper "'And" with quote attached (curly quote)
        expect(verse45Text).toMatch(/\u2018AND/i)
    })

    // Test cases for "I am" and "It is" - should NOT merge when in same text node
    test('verse 20 "It is I" - "I" is NOT merged (same text node)', async () => {
        const result = await cachedParseApiBibleChapter(nasbJohn6Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse20 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 20),
        )

        expect(verse20.length).toBeGreaterThan(0)
        const verse20Text = verse20.map(v => v.text).join("")

        // "It is I" should be properly spaced, not merged
        expect(verse20Text).toContain("It is I")
        // Should NOT have "Itis" or "isI" merged
        expect(verse20Text).not.toMatch(/Itis/)
        expect(verse20Text).not.toMatch(/isI/)
    })

    test('verse 35 "I am" - "I" is NOT merged (same text node)', async () => {
        const result = await cachedParseApiBibleChapter(nasbJohn6Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse35 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 35),
        )

        expect(verse35.length).toBeGreaterThan(0)
        const verse35Text = verse35.map(v => v.text).join("")

        // "I am" should be properly spaced
        expect(verse35Text).toContain("I am")
        // Should NOT have "Iam" merged
        expect(verse35Text).not.toMatch(/Iam/)
    })

    test('verse 41 "I am" - "I" is NOT merged (same text node)', async () => {
        const result = await cachedParseApiBibleChapter(nasbJohn6Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse41 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 41),
        )

        expect(verse41.length).toBeGreaterThan(0)
        const verse41Text = verse41.map(v => v.text).join("")

        // "I am" should be properly spaced
        expect(verse41Text).toContain("I am")
        // Should NOT have "Iam" merged
        expect(verse41Text).not.toMatch(/Iam/)
    })

    test('verse 42 "Is this" - properly spaced (same text node)', async () => {
        const result = await cachedParseApiBibleChapter(nasbJohn6Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse42 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 42),
        )

        expect(verse42.length).toBeGreaterThan(0)
        const verse42Text = verse42.map(v => v.text).join("")

        // "Is this not Jesus" should be properly spaced
        expect(verse42Text).toContain("Is this not Jesus")
        // Should NOT have "Isthis" merged
        expect(verse42Text).not.toMatch(/Isthis/)
    })
})

// ============================================================================
// JOHN 8:11 NASB - DOUBLE BRACKET MERGE
// ============================================================================
describe("John 8:11 NASB - Double bracket merge", () => {
    const nasbJohn8Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nasb/john_8.html",
        ),
        "utf-8",
    )

    test.concurrent("verse 11 ends with closing quote merged with brackets", async () => {
        const result = await cachedParseApiBibleChapter(nasbJohn8Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse11 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 11),
        )

        expect(verse11.length).toBeGreaterThan(0)
        const verse11Text = verse11.map(v => v.text).join("")

        // The ]] should be merged with the closing quote, not separate
        // Should end with something like: longer."]]
        expect(verse11Text).toMatch(/longer\.["\u201D]\]\]/)
        // Should NOT have space before ]]
        expect(verse11Text).not.toMatch(/\s+\]\]/)
    })
})

// ============================================================================
// JOHN 10:34 NASB - QUOTE+PUNCTUATION MERGE
// ============================================================================
describe("John 10:34 NASB - Quote+punctuation merge", () => {
    const nasbJohn10Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nasb/john_10.html",
        ),
        "utf-8",
    )

    test.concurrent("verse 34 ends with gods'? (no space before quote)", async () => {
        const result = await cachedParseApiBibleChapter(nasbJohn10Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse34 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 34),
        )

        expect(verse34.length).toBeGreaterThan(0)
        const verse34Text = verse34.map(v => v.text).join("")

        // Should have gods'? with no space before the closing quote
        // Uses U+2019 (RIGHT SINGLE QUOTATION MARK)
        expect(verse34Text).toMatch(/gods['\u2019]\?/i)
        // Should NOT have space before '?
        expect(verse34Text).not.toMatch(/gods\s+['\u2019]\?/)
    })
})

// ============================================================================
// JOHN 12:38 NASB - STANDALONE QUESTION MARK
// ============================================================================
describe("John 12:38 NASB - Standalone question mark", () => {
    const nasbJohn12Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nasb/john_12.html",
        ),
        "utf-8",
    )

    test('verse 38 has question mark after "report" (no space before ?)', async () => {
        const result = await cachedParseApiBibleChapter(nasbJohn12Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse38 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 38),
        )

        expect(verse38.length).toBeGreaterThan(0)
        const verse38Text = verse38.map(v => v.text).join("")

        // Should have "report?" with no space before the question mark
        expect(verse38Text).toMatch(/report\?/i)
        // Should NOT have space before ?
        expect(verse38Text).not.toMatch(/report\s+\?/)
    })
})

// ============================================================================
// PROVERBS 20 NLT - DIVINE NAME (nd class) AND POSSESSIVE MERGE
// ============================================================================
describe("Proverbs 20 NLT - Divine name and possessive", () => {
    const nltProverbs20Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nlt/proverbs_20.html",
        ),
        "utf-8",
    )

    test.concurrent("verse 10 has Lord marked as divine name (nd class)", async () => {
        const result = await cachedParseApiBibleChapter(
            nltProverbs20Html,
            "nlt",
        )
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse10 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 10),
        )

        expect(verse10.length).toBeGreaterThan(0)

        // Find the "Lord" word and check it has divineName flag
        const lordWord = verse10
            .flatMap(v => v.nodes)
            .find(
                n =>
                    n.type === "word" &&
                    n.letters.join("").toLowerCase().startsWith("lord"),
            )
        expect(lordWord).toBeDefined()
        expect(lordWord?.type === "word" && lordWord.divineName).toBe(true)
    })

    test.concurrent("verse 12 has Lord marked as divine name (nd class)", async () => {
        const result = await cachedParseApiBibleChapter(
            nltProverbs20Html,
            "nlt",
        )
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse12 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 12),
        )

        expect(verse12.length).toBeGreaterThan(0)

        // Find the "Lord" word and check it has divineName flag
        const lordWord = verse12
            .flatMap(v => v.nodes)
            .find(
                n =>
                    n.type === "word" &&
                    n.letters.join("").toLowerCase().startsWith("lord"),
            )
        expect(lordWord).toBeDefined()
        expect(lordWord?.type === "word" && lordWord.divineName).toBe(true)
    })

    test.concurrent("verse 27 has LORD's with possessive merged and divine name flag", async () => {
        const result = await cachedParseApiBibleChapter(
            nltProverbs20Html,
            "nlt",
        )
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse27 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 27),
        )

        expect(verse27.length).toBeGreaterThan(0)
        const verse27Text = verse27.map(v => v.text).join("")

        // Should have LORD's (uppercase) with no space before 's
        expect(verse27Text).toMatch(/LORD[''\u2019]s/)
        // Should NOT have space between LORD and 's
        expect(verse27Text).not.toMatch(/LORD\s+[''\u2019]s/)

        // The merged word should have divineName flag
        const lordWord = verse27
            .flatMap(v => v.nodes)
            .find(
                n =>
                    n.type === "word" &&
                    n.letters.join("").toUpperCase().startsWith("LORD"),
            )
        expect(lordWord).toBeDefined()
        expect(lordWord?.type === "word" && lordWord.divineName).toBe(true)
    })
})

// ============================================================================
// ACTS 10:34 / HEBREWS 7:21 NASB - TYPABILITY REGRESSIONS
// ============================================================================
describe("NASB typability regressions", () => {
    test.concurrent('Acts 10:34 keeps "I most" as two words', async () => {
        const acts10Html = `
            <p class="p">
                <span data-number="34" data-sid="ACT 10:34" class="v">34</span>
                <span class="sc">I</span>
                <span> most certainly understand now that God is not one to show partiality,</span>
            </p>
        `

        const result = await cachedParseApiBibleChapter(acts10Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse34 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 34),
        )

        expect(verse34.length).toBeGreaterThan(0)
        const verse34Text = verse34.map(v => v.text).join("")
        expect(verse34Text).toContain("I most")
        expect(verse34Text).not.toContain("Imost")

        const words = verse34.flatMap(v =>
            v.nodes.filter((n): n is Word => n.type === "word"),
        )
        const wordTexts = words.map(w => w.letters.join(""))
        expect(wordTexts).toContain("I ")
        expect(wordTexts).toContain("most ")
    })

    test.concurrent("Hebrews 7:21 merges quote+paren+semicolon with preceding word", async () => {
        const hebrews7Html = `
            <p class="p">
                <span data-number="21" data-sid="HEB 7:21" class="v">21</span>
                <span> (for they indeed became priests without an oath, but He with an oath through the One who said to Him, </span>
                <span class="sc">FOREVER</span>
                <span>'");</span>
            </p>
        `

        const result = await cachedParseApiBibleChapter(hebrews7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse21 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 21),
        )

        expect(verse21.length).toBeGreaterThan(0)
        const verse21Text = verse21.map(v => v.text).join("")
        const trailingSequence = "FOREVER'\");"
        expect(verse21Text).toContain(trailingSequence)
        expect(verse21Text).not.toContain("FOREVER '")
        expect(verse21Text).not.toMatch(/FOREVER\s+['"]/)

        const words = verse21.flatMap(v =>
            v.nodes.filter((n): n is Word => n.type === "word"),
        )
        const wordTexts = words.map(w => w.letters.join(""))
        expect(wordTexts.some(w => w.includes(trailingSequence))).toBe(true)
    })

    test.concurrent("Hebrews 7:21 handles split closing quote tokens and keeps semicolon typable", async () => {
        const hebrews7Html = `
            <p class="q1">
                <span data-number="21" data-sid="HEB 7:21" class="v">21</span>
                <span class="sc">YOU ARE A PRIEST FOREVER</span>
                <span>’”</span>
                <span>);</span>
            </p>
        `

        const result = await cachedParseApiBibleChapter(hebrews7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse21 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 21),
        )

        expect(verse21.length).toBeGreaterThan(0)
        const verse21Text = verse21.map(v => v.text).join("")
        expect(verse21Text).toContain("FOREVER’”);")
        expect(verse21Text).not.toContain("FOREVER ’”")

        const words = verse21.flatMap(v =>
            v.nodes.filter((n): n is Word => n.type === "word"),
        )
        const lastWord = words[words.length - 1]
        expect(lastWord).toBeDefined()
        expect(lastWord!.letters.join("")).toContain("FOREVER’”);")
        // Last word must end in a trailing space so verse completion is reachable.
        expect(lastWord!.letters[lastWord!.letters.length - 1]).toBe(" ")

        // Whole small-caps quote should be marked with OT reference styling metadata.
        const allSmallCapsWordsAreStyled = words.every(
            w => w.oldTestamentReference === true,
        )
        expect(allSmallCapsWordsAreStyled).toBe(true)
        expect(words.some(w => w.divineName === true)).toBe(false)
    })

    test.concurrent("NASB OT reference split markers combine into full words", async () => {
        const hebrews7Html = `
            <p class="q1">
                <span data-number="17" data-sid="HEB 7:17" class="v">17</span>
                <span class="sc">Y\u2009ou A\u2009ccording M\u2009elchizedek</span>
            </p>
        `

        const result = await cachedParseApiBibleChapter(hebrews7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse17 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 17),
        )

        expect(verse17.length).toBeGreaterThan(0)
        const words = verse17.flatMap(v =>
            v.nodes.filter((n): n is Word => n.type === "word"),
        )
        const wordTexts = words.map(w => w.letters.join("").trim())

        expect(wordTexts).toEqual(["YOU", "ACCORDING", "MELCHIZEDEK"])
    })

    test.concurrent("NASB OT reference split keeps standalone one-letter words separate", async () => {
        const hebrews7Html = `
            <p class="q1">
                <span data-number="17" data-sid="HEB 7:17" class="v">17</span>
                <span>A </span>
                <span>P</span><span class="sc">riest</span>
            </p>
        `

        const result = await cachedParseApiBibleChapter(hebrews7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse17 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 17),
        )

        expect(verse17.length).toBeGreaterThan(0)
        const words = verse17.flatMap(v =>
            v.nodes.filter((n): n is Word => n.type === "word"),
        )
        const wordTexts = words.map(w => w.letters.join("").trim())

        expect(wordTexts).toEqual(["A", "PRIEST"])
    })

    test.concurrent("NASB OT reference in same sc span merges Y OU but keeps A PRIEST separate", async () => {
        const hebrews7Html = `
            <p class="q1">
                <span data-number="17" data-sid="HEB 7:17" class="v">17</span>
                <span class="sc">Y OU ARE A PRIEST</span>
            </p>
        `

        const result = await cachedParseApiBibleChapter(hebrews7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse17 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 17),
        )

        expect(verse17.length).toBeGreaterThan(0)
        const words = verse17.flatMap(v =>
            v.nodes.filter((n): n is Word => n.type === "word"),
        )
        const wordTexts = words.map(w => w.letters.join("").trim())

        expect(wordTexts).toEqual(["YOU", "ARE", "A", "PRIEST"])
    })
})

describe("NASB typability regressions (real API.Bible fixtures)", () => {
    const nasbActs10Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nasb/acts_10.html",
        ),
        "utf8",
    )

    const nasbHebrews7Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nasb/hebrews_7.html",
        ),
        "utf8",
    )

    test.concurrent('Acts 10:34 keeps "I most" as separate words in real fixture', async () => {
        const result = await cachedParseApiBibleChapter(nasbActs10Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse34 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 34),
        )

        expect(verse34.length).toBeGreaterThan(0)
        const verse34Text = verse34.map(v => v.text).join("")
        expect(verse34Text).toContain("I most")
        expect(verse34Text).not.toContain("Imost")
    })

    test.concurrent("Hebrews 7:17 combines split OT-reference words in real fixture", async () => {
        const result = await cachedParseApiBibleChapter(
            nasbHebrews7Html,
            "nasb",
        )
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse17 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 17),
        )

        expect(verse17.length).toBeGreaterThan(0)
        const words = verse17.flatMap(v =>
            v.nodes.filter((n): n is Word => n.type === "word"),
        )
        const text = words.map(w => w.letters.join("")).join("")

        expect(text).toContain("YOU")
        expect(text).toContain("ACCORDING")
        expect(text).toContain("MELCHIZEDEK")
        expect(text).not.toContain("Y OU")
        expect(text).not.toContain("A CCORDING")
        expect(text).not.toContain("M ELCHIZEDEK")
    })

    test.concurrent("Hebrews 7:21 keeps closing quote+paren+semicolon typable in real fixture", async () => {
        const result = await cachedParseApiBibleChapter(
            nasbHebrews7Html,
            "nasb",
        )
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse21 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 21),
        )

        expect(verse21.length).toBeGreaterThan(0)
        const verse21Text = verse21.map(v => v.text).join("")
        expect(verse21Text).toContain("FOREVER’”);")
        expect(verse21Text).not.toContain("FOREVER ’”);")
        expect(verse21Text).not.toContain("FOREVER’”) ;")

        const words = verse21.flatMap(v =>
            v.nodes.filter((n): n is Word => n.type === "word"),
        )
        const lastWord = words[words.length - 1]
        expect(lastWord).toBeDefined()
        expect(lastWord!.letters.join("")).toContain("FOREVER’”);")
        expect(lastWord!.letters[lastWord!.letters.length - 1]).toBe(" ")
    })

    test.concurrent("Psalm 11:4 keeps LORD’S and throne as separate words in real fixture", async () => {
        const nasbPsalm11Html = fs.readFileSync(
            path.join(
                process.cwd(),
                "src/server/api-bible/responses/nasb/psalm_11.html",
            ),
            "utf8",
        )

        const result = await cachedParseApiBibleChapter(nasbPsalm11Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse4 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 4),
        )

        expect(verse4.length).toBeGreaterThan(0)

        const words = verse4.flatMap(v =>
            v.nodes.filter((n): n is Word => n.type === "word"),
        )
        const wordTexts = words.map(w => w.letters.join(""))
        const verse4Text = verse4.map(v => v.text).join("")

        // Should render as "... temple; the LORD’S throne is ..."
        expect(verse4Text).toMatch(
            /temple;\s+the\s+LORD['\u2019]S\s+throne\s+is/i,
        )

        // Regression checks for broken split shape
        expect(wordTexts.some(w => /LORD['\u2019]S\s$/i.test(w))).toBe(true)
        expect(wordTexts).toContain("throne ")
        expect(wordTexts.some(w => /Sthrone/i.test(w))).toBe(false)
    })

    test.concurrent("Psalm 11 title does not split LORD in real fixture", async () => {
        const nasbPsalm11Html = fs.readFileSync(
            path.join(
                process.cwd(),
                "src/server/api-bible/responses/nasb/psalm_11.html",
            ),
            "utf8",
        )

        const result = await cachedParseApiBibleChapter(nasbPsalm11Html, "nasb")
        const h4Headings = result.nodes.filter(
            (n): n is { type: "h4"; text: string } => n.type === "h4",
        )

        const heading = h4Headings.find(h =>
            h.text.includes("Refuge and Defense"),
        )
        expect(heading).toBeDefined()
        expect(heading?.text).toContain("The LORD, a Refuge and Defense.")
        expect(heading?.text).not.toContain("L ORD")
    })
})

// ============================================================================
// JOHN 1:15 NASB - NESTED QUOTES (single quote followed by double quote)
// ============================================================================
describe("John 1:15 NASB - Nested quote handling", () => {
    const nasbJohn1Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nasb/john_1.html",
        ),
        "utf8",
    )

    test.concurrent("parses John 1 successfully", async () => {
        const result = await cachedParseApiBibleChapter(nasbJohn1Html, "nasb")
        expect(result.nodes.length).toBeGreaterThan(0)
    })

    test.concurrent("verse 15 nested quotes have no space between them", async () => {
        const result = await cachedParseApiBibleChapter(nasbJohn1Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse15 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 15),
        )

        expect(verse15.length).toBeGreaterThan(0)
        const verse15Text = verse15.map(v => v.text).join("")

        // Should have closing quotes together without space: .'" or .'\"
        // The text ends with: before me.'"
        expect(verse15Text).toMatch(/me\.['\u2019]["\u201D]\s*$/)
        // Should NOT have space between the quotes
        expect(verse15Text).not.toMatch(/me\.['\u2019]\s+["\u201D]/)
    })
})

// ============================================================================
// LUKE 10:27 NASB - PUNCTUATION+QUOTE MERGED WITH PREVIOUS WORD
// ============================================================================
describe("Luke 10:27 NASB - Punct+quote merging", () => {
    const nasbLuke10Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nasb/luke_10.html",
        ),
        "utf8",
    )

    test.concurrent("parses Luke 10 successfully", async () => {
        const result = await cachedParseApiBibleChapter(nasbLuke10Html, "nasb")
        expect(result.nodes.length).toBeGreaterThan(0)
    })

    test('verse 27 "yourself" has punct+quote attached (no space before .")', async () => {
        const result = await cachedParseApiBibleChapter(nasbLuke10Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse27 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 27),
        )

        expect(verse27.length).toBeGreaterThan(0)
        const verse27Text = verse27.map(v => v.text).join("")

        // Should have "yourself." with no space before the period+quote
        expect(verse27Text).toMatch(/yourself\.\u201D/i)
        expect(verse27Text).not.toContain("yourself .\u201D")
        expect(verse27Text).not.toContain('yourself ."')
    })

    test.concurrent("verse 27 last word is complete (ends with space)", async () => {
        const result = await cachedParseApiBibleChapter(nasbLuke10Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )
        const verse27 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 27),
        )

        const verse27Words = verse27.flatMap(v =>
            v.nodes.filter((n): n is Word => n.type === "word"),
        )
        const lastWord = verse27Words[verse27Words.length - 1]
        expect(lastWord).toBeDefined()

        // Verify it's complete (ends with space)
        const lastLetter = lastWord!.letters[lastWord!.letters.length - 1]
        expect(lastLetter).toBe(" ")
    })
})

// ============================================================================
// REVELATION 4:11 NASB - LIST ITEM MERGED (lim class)
// ============================================================================
describe("Revelation 4:11 NASB - lim class paragraph", () => {
    const nasbRev4Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nasb/revelation_4.html",
        ),
        "utf8",
    )

    test.concurrent("parses Revelation 4 successfully", async () => {
        const result = await cachedParseApiBibleChapter(nasbRev4Html, "nasb")
        expect(result.nodes.length).toBeGreaterThan(0)
        expect(result.firstVerse.book).toBe("revelation")
        expect(result.firstVerse.chapter).toBe(4)
    })

    test.concurrent("parses all 11 verses", async () => {
        const result = await cachedParseApiBibleChapter(nasbRev4Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verseNumbers = new Set<number>()
        for (const p of paragraphs) {
            for (const v of p.nodes) {
                verseNumbers.add(v.verse.verse)
            }
        }

        expect(verseNumbers.size).toBe(11)
        for (let i = 1; i <= 11; i++) {
            expect(verseNumbers.has(i)).toBe(true)
        }
    })

    test.concurrent("verse 11 exists and has content", async () => {
        const result = await cachedParseApiBibleChapter(nasbRev4Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verse11 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 11),
        )

        expect(verse11.length).toBeGreaterThan(0)
        const verse11Text = verse11.map(v => v.text).join("")

        // Verse 11 content: "Worthy are You, our Lord and our God..."
        expect(verse11Text).toContain("Worthy")
        expect(verse11Text).toContain("Lord")
        expect(verse11Text).toContain("God")
        expect(verse11Text).toContain("created")
    })

    test.concurrent("verse 11 has typeable words", async () => {
        const result = await cachedParseApiBibleChapter(nasbRev4Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verse11 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 11),
        )

        const words = verse11.flatMap(v =>
            v.nodes.filter((n): n is Word => n.type === "word"),
        )

        expect(words.length).toBeGreaterThan(10) // verse 11 has many words
    })
})

// ============================================================================
// REVELATION 7:5-8 NASB - LIST ITEM MERGED (lim class)
// ============================================================================
describe("Revelation 7:5-8 NASB - lim class paragraphs", () => {
    const nasbRev7Html = fs.readFileSync(
        path.join(
            process.cwd(),
            "src/server/api-bible/responses/nasb/revelation_7.html",
        ),
        "utf8",
    )

    test.concurrent("parses Revelation 7 successfully", async () => {
        const result = await cachedParseApiBibleChapter(nasbRev7Html, "nasb")
        expect(result.nodes.length).toBeGreaterThan(0)
        expect(result.firstVerse.book).toBe("revelation")
        expect(result.firstVerse.chapter).toBe(7)
    })

    test.concurrent("parses all 17 verses", async () => {
        const result = await cachedParseApiBibleChapter(nasbRev7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verseNumbers = new Set<number>()
        for (const p of paragraphs) {
            for (const v of p.nodes) {
                verseNumbers.add(v.verse.verse)
            }
        }

        expect(verseNumbers.size).toBe(17)
        for (let i = 1; i <= 17; i++) {
            expect(verseNumbers.has(i)).toBe(true)
        }
    })

    test.concurrent("verses 5-8 exist and have content (lim class)", async () => {
        const result = await cachedParseApiBibleChapter(nasbRev7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        for (const verseNum of [5, 6, 7, 8]) {
            const verse = paragraphs.flatMap(p =>
                p.nodes.filter(v => v.verse.verse === verseNum),
            )

            expect(verse.length).toBeGreaterThan(0)
            const verseText = verse.map(v => v.text).join("")

            // Each verse mentions "tribe" and "twelve thousand"
            expect(verseText).toContain("tribe")
            expect(verseText).toContain("twelve")
        }
    })

    test.concurrent("verse 5 mentions Judah, Reuben, Gad", async () => {
        const result = await cachedParseApiBibleChapter(nasbRev7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verse5 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 5),
        )
        const verse5Text = verse5.map(v => v.text).join("")

        expect(verse5Text).toContain("Judah")
        expect(verse5Text).toContain("Reuben")
        expect(verse5Text).toContain("Gad")
    })

    test.concurrent("verse 8 mentions Zebulun, Joseph, Benjamin", async () => {
        const result = await cachedParseApiBibleChapter(nasbRev7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        const verse8 = paragraphs.flatMap(p =>
            p.nodes.filter(v => v.verse.verse === 8),
        )
        const verse8Text = verse8.map(v => v.text).join("")

        expect(verse8Text).toContain("Zebulun")
        expect(verse8Text).toContain("Joseph")
        expect(verse8Text).toContain("Benjamin")
    })

    test.concurrent("verses 5-8 have typeable words", async () => {
        const result = await cachedParseApiBibleChapter(nasbRev7Html, "nasb")
        const paragraphs = result.nodes.filter(
            (n): n is Paragraph => n.type === "paragraph",
        )

        for (const verseNum of [5, 6, 7, 8]) {
            const verse = paragraphs.flatMap(p =>
                p.nodes.filter(v => v.verse.verse === verseNum),
            )

            const words = verse.flatMap(v =>
                v.nodes.filter((n): n is Word => n.type === "word"),
            )

            expect(words.length).toBeGreaterThan(5)
        }
    })
})
