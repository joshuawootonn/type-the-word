import fs from "fs"
import path from "path"
import { describe, expect, test } from "vitest"

import { Paragraph, Word } from "~/lib/parseEsv"

import { parseApiBibleChapter } from "./parse-api-bible"

const leviticus23ChapterHtml = fs.readFileSync(
    path.join(
        process.cwd(),
        "src/server/api-bible/responses/nlt/leviticus_23.html",
    ),
    "utf8",
)

describe("parseApiBibleChapter - NLT Leviticus punctuation merges", () => {
    test("merges LORD + .) into one typeable word in Leviticus 23:38", async () => {
        const result = await parseApiBibleChapter(leviticus23ChapterHtml, "nlt")
        const paragraphs = result.nodes.filter(
            (node): node is Paragraph => node.type === "paragraph",
        )

        const verse38Words = paragraphs
            .flatMap(paragraph => paragraph.nodes)
            .filter(verse => verse.verse.verse === 38)
            .flatMap(verse => verse.nodes)
            .filter((node): node is Word => node.type === "word")
            .map(word => word.letters.join("").trim())

        expect(verse38Words).toContain("LORD.)")
        expect(verse38Words).not.toContain(".)")
    })
})
