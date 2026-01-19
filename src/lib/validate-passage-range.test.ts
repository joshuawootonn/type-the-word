import { describe, expect, test } from "vitest"

import {
    countVersesInRange,
    validatePassageRange,
} from "./validate-passage-range"

describe("validatePassageRange", () => {
    test("WHEN valid single verse THEN returns valid", () => {
        const result = validatePassageRange({
            book: "john",
            startChapter: 3,
            startVerse: 16,
            endChapter: 3,
            endVerse: 16,
        })

        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
    })

    test("WHEN valid verse range in same chapter THEN returns valid", () => {
        const result = validatePassageRange({
            book: "john",
            startChapter: 3,
            startVerse: 16,
            endChapter: 3,
            endVerse: 18,
        })

        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
    })

    test("WHEN valid multi-chapter range THEN returns valid", () => {
        const result = validatePassageRange({
            book: "genesis",
            startChapter: 1,
            startVerse: 1,
            endChapter: 2,
            endVerse: 3,
        })

        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
    })

    test("WHEN end verse before start verse in same chapter THEN returns invalid", () => {
        const result = validatePassageRange({
            book: "john",
            startChapter: 3,
            startVerse: 18,
            endChapter: 3,
            endVerse: 16,
        })

        expect(result.valid).toBe(false)
        expect(result.error).toContain("must be after or equal to")
    })

    test("WHEN end chapter before start chapter THEN returns invalid", () => {
        const result = validatePassageRange({
            book: "john",
            startChapter: 5,
            startVerse: 1,
            endChapter: 3,
            endVerse: 1,
        })

        expect(result.valid).toBe(false)
        expect(result.error).toContain("must be after or equal to")
    })

    test("WHEN start chapter exceeds book length THEN returns invalid", () => {
        const result = validatePassageRange({
            book: "jude",
            startChapter: 2, // Jude only has 1 chapter
            startVerse: 1,
            endChapter: 2,
            endVerse: 5,
        })

        expect(result.valid).toBe(false)
        expect(result.error).toContain("does not exist")
    })

    test("WHEN start verse exceeds chapter length THEN returns invalid", () => {
        const result = validatePassageRange({
            book: "john",
            startChapter: 3,
            startVerse: 500, // John 3 has 36 verses
            endChapter: 3,
            endVerse: 500,
        })

        expect(result.valid).toBe(false)
        expect(result.error).toContain("does not exist")
    })

    test("WHEN end verse exceeds chapter length THEN returns invalid", () => {
        const result = validatePassageRange({
            book: "john",
            startChapter: 3,
            startVerse: 1,
            endChapter: 3,
            endVerse: 500, // John 3 has 36 verses
        })

        expect(result.valid).toBe(false)
        expect(result.error).toContain("does not exist")
    })

    test("WHEN chapter is 0 THEN returns invalid", () => {
        const result = validatePassageRange({
            book: "john",
            startChapter: 0,
            startVerse: 1,
            endChapter: 1,
            endVerse: 1,
        })

        expect(result.valid).toBe(false)
        expect(result.error).toContain("does not exist")
    })

    test("WHEN verse is 0 THEN returns invalid", () => {
        const result = validatePassageRange({
            book: "john",
            startChapter: 1,
            startVerse: 0,
            endChapter: 1,
            endVerse: 1,
        })

        expect(result.valid).toBe(false)
        expect(result.error).toContain("does not exist")
    })
})

describe("countVersesInRange", () => {
    test("WHEN single verse THEN returns 1", () => {
        const count = countVersesInRange({
            book: "john",
            startChapter: 3,
            startVerse: 16,
            endChapter: 3,
            endVerse: 16,
        })

        expect(count).toBe(1)
    })

    test("WHEN verse range in same chapter THEN returns correct count", () => {
        const count = countVersesInRange({
            book: "john",
            startChapter: 3,
            startVerse: 16,
            endChapter: 3,
            endVerse: 18,
        })

        expect(count).toBe(3) // verses 16, 17, 18
    })

    test("WHEN entire chapter THEN returns chapter length", () => {
        // Genesis 1 has 31 verses
        const count = countVersesInRange({
            book: "genesis",
            startChapter: 1,
            startVerse: 1,
            endChapter: 1,
            endVerse: 31,
        })

        expect(count).toBe(31)
    })

    test("WHEN multiple chapters THEN returns correct total", () => {
        // Genesis 1 has 31 verses, Genesis 2 has 25 verses
        // From Genesis 1:1 to Genesis 2:3 should be:
        // - All of chapter 1 (31 verses)
        // - First 3 verses of chapter 2 (3 verses)
        // Total: 34 verses
        const count = countVersesInRange({
            book: "genesis",
            startChapter: 1,
            startVerse: 1,
            endChapter: 2,
            endVerse: 3,
        })

        expect(count).toBe(34)
    })

    test("WHEN partial start and end chapters THEN returns correct count", () => {
        // Genesis 1 has 31 verses, Genesis 2 has 25 verses, Genesis 3 has 24 verses
        // From Genesis 1:10 to Genesis 3:5 should be:
        // - Chapter 1 verses 10-31 (22 verses)
        // - All of chapter 2 (25 verses)
        // - Chapter 3 verses 1-5 (5 verses)
        // Total: 52 verses
        const count = countVersesInRange({
            book: "genesis",
            startChapter: 1,
            startVerse: 10,
            endChapter: 3,
            endVerse: 5,
        })

        expect(count).toBe(52)
    })

    test("WHEN single-chapter book (Jude) THEN returns correct count", () => {
        // Jude has 1 chapter with 25 verses
        const count = countVersesInRange({
            book: "jude",
            startChapter: 1,
            startVerse: 1,
            endChapter: 1,
            endVerse: 25,
        })

        expect(count).toBe(25)
    })

    test("WHEN Psalm 119 (longest chapter) THEN returns correct count", () => {
        // Psalm 119 has 176 verses
        const count = countVersesInRange({
            book: "psalm",
            startChapter: 119,
            startVerse: 1,
            endChapter: 119,
            endVerse: 176,
        })

        expect(count).toBe(176)
    })
})
