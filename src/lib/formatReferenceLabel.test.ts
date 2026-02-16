import { describe, expect, test } from "vitest"

import { formatReferenceLabel } from "./formatReferenceLabel"

describe("formatReferenceLabel", () => {
    test("WHEN a single verse THEN returns chapter and verse", () => {
        expect(
            formatReferenceLabel({
                book: "john",
                startChapter: 3,
                startVerse: 16,
                endChapter: 3,
                endVerse: 16,
            }),
        ).toBe("John 3:16")
    })

    test("WHEN a same-chapter range THEN returns start-end verse range", () => {
        expect(
            formatReferenceLabel({
                book: "john",
                startChapter: 3,
                startVerse: 16,
                endChapter: 3,
                endVerse: 18,
            }),
        ).toBe("John 3:16-18")
    })

    test("WHEN a cross-chapter range THEN returns chapter:verse-chapter:verse", () => {
        expect(
            formatReferenceLabel({
                book: "genesis",
                startChapter: 1,
                startVerse: 31,
                endChapter: 2,
                endVerse: 3,
            }),
        ).toBe("Genesis 1:31-2:3")
    })

    test("WHEN book has underscores and a number THEN normalizes book name", () => {
        expect(
            formatReferenceLabel({
                book: "1_corinthians",
                startChapter: 13,
                startVerse: 4,
                endChapter: 13,
                endVerse: 7,
            }),
        ).toBe("1 Corinthians 13:4-7")
    })
})
