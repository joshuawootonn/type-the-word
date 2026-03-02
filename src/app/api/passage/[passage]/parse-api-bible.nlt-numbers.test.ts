import fs from "fs"
import path from "path"
import { describe, expect, test } from "vitest"

import { Paragraph } from "~/lib/parseEsv"

import { parseApiBibleChapter } from "./parse-api-bible"

function getNonHangingVerseValues(html: string): Promise<string[]> {
    return parseApiBibleChapter(html, "nlt").then(result => {
        const paragraphs = result.nodes.filter(
            (node): node is Paragraph => node.type === "paragraph",
        )

        return paragraphs
            .flatMap(p => p.nodes)
            .filter(v => !v.metadata.hangingVerse)
            .map(v => v.verse.value)
    })
}

const numbers1ChapterHtml = fs.readFileSync(
    path.join(
        process.cwd(),
        "src/server/api-bible/responses/nlt/numbers_1.html",
    ),
    "utf8",
)

const numbers2ChapterHtml = fs.readFileSync(
    path.join(
        process.cwd(),
        "src/server/api-bible/responses/nlt/numbers_2.html",
    ),
    "utf8",
)

const numbers1RangeHtml = fs.readFileSync(
    path.join(
        process.cwd(),
        "src/server/api-bible/responses/nlt/numbers_1_22_43.html",
    ),
    "utf8",
)

const numbers2Range1215Html = fs.readFileSync(
    path.join(
        process.cwd(),
        "src/server/api-bible/responses/nlt/numbers_2_12_15.html",
    ),
    "utf8",
)

const numbers2Range2023Html = fs.readFileSync(
    path.join(
        process.cwd(),
        "src/server/api-bible/responses/nlt/numbers_2_20_23.html",
    ),
    "utf8",
)

describe("parseApiBibleChapter - NLT Numbers table content", () => {
    test("keeps Numbers 1 table verse ranges in chapter parsing", async () => {
        const verseValues = await getNonHangingVerseValues(numbers1ChapterHtml)

        expect(verseValues).toEqual(
            expect.arrayContaining([
                "22-23",
                "24-25",
                "26-27",
                "28-29",
                "30-31",
                "32-33",
                "34-35",
                "36-37",
                "38-39",
                "40-41",
                "42-43",
            ]),
        )
    })

    test("keeps Numbers 2 table verse ranges in chapter parsing", async () => {
        const verseValues = await getNonHangingVerseValues(numbers2ChapterHtml)

        expect(verseValues).toEqual(
            expect.arrayContaining(["12-13", "14-15", "20-21", "22-23"]),
        )
    })

    test("keeps Numbers 1:5 table continuation rows", async () => {
        const result = await parseApiBibleChapter(numbers1ChapterHtml, "nlt")
        const paragraphs = result.nodes.filter(
            (node): node is Paragraph => node.type === "paragraph",
        )
        const verse5Text = paragraphs
            .flatMap(p => p.nodes)
            .filter(v => v.verse.verse === 5)
            .map(v => v.text)
            .join(" ")

        expect(verse5Text).toContain("Tribe")
        expect(verse5Text).toContain("Leader")
        expect(verse5Text).toContain("Reuben")
        expect(verse5Text).toContain("Elizur son of Shedeur")
    })

    test("parses Numbers 1:22-43 range fixture", async () => {
        const result = await parseApiBibleChapter(numbers1RangeHtml, "nlt")
        const verseValues = await getNonHangingVerseValues(numbers1RangeHtml)

        expect(result.firstVerse.book).toBe("numbers")
        expect(result.firstVerse.chapter).toBe(1)
        expect(result.firstVerse.value).toBe("22-23")
        expect(verseValues).toEqual(
            expect.arrayContaining(["22-23", "24-25", "42-43"]),
        )
    })

    test("parses Numbers 2:12-15 range fixture", async () => {
        const result = await parseApiBibleChapter(numbers2Range1215Html, "nlt")
        const verseValues = await getNonHangingVerseValues(
            numbers2Range1215Html,
        )

        expect(result.firstVerse.book).toBe("numbers")
        expect(result.firstVerse.chapter).toBe(2)
        expect(result.firstVerse.value).toBe("12-13")
        expect(verseValues).toEqual(expect.arrayContaining(["12-13", "14-15"]))
    })

    test("parses Numbers 2:20-23 range fixture", async () => {
        const result = await parseApiBibleChapter(numbers2Range2023Html, "nlt")
        const verseValues = await getNonHangingVerseValues(
            numbers2Range2023Html,
        )

        expect(result.firstVerse.book).toBe("numbers")
        expect(result.firstVerse.chapter).toBe(2)
        expect(result.firstVerse.value).toBe("20-21")
        expect(verseValues).toEqual(expect.arrayContaining(["20-21", "22-23"]))
    })
})
