import { describe, expect, test } from "vitest"

import { getLatestVerseByChapter } from "./verse-location"

describe("getLatestVerseByChapter", () => {
    test.concurrent("keeps the latest row for each chapter:verse key", () => {
        const rows = [
            {
                chapter: 1,
                verse: 1,
                createdAt: new Date("2026-01-01T10:00:00.000Z"),
                id: "old-1-1",
            },
            {
                chapter: 1,
                verse: 1,
                createdAt: new Date("2026-01-01T12:00:00.000Z"),
                id: "new-1-1",
            },
            {
                chapter: 2,
                verse: 1,
                createdAt: new Date("2026-01-01T11:00:00.000Z"),
                id: "only-2-1",
            },
        ]

        const result = getLatestVerseByChapter(rows)

        expect(result.size).toBe(2)
        expect(result.get("1:1")?.id).toBe("new-1-1")
        expect(result.get("2:1")?.id).toBe("only-2-1")
    })

    test.concurrent("returns an empty map when no rows are provided", () => {
        const result = getLatestVerseByChapter([])

        expect(result.size).toBe(0)
    })

    test.concurrent("keeps the first row when duplicate timestamps are equal", () => {
        const sameTimestamp = new Date("2026-01-01T10:00:00.000Z")
        const rows = [
            {
                chapter: 3,
                verse: 16,
                createdAt: sameTimestamp,
                id: "first",
            },
            {
                chapter: 3,
                verse: 16,
                createdAt: sameTimestamp,
                id: "second",
            },
        ]

        const result = getLatestVerseByChapter(rows)

        expect(result.size).toBe(1)
        expect(result.get("3:16")?.id).toBe("first")
    })

    test.concurrent("uses verse-only keys when chapterOnly is enabled", () => {
        const rows = [
            {
                chapter: 2,
                verse: 1,
                createdAt: new Date("2026-01-01T12:00:00.000Z"),
                id: "two-one",
            },
            {
                chapter: 2,
                verse: 2,
                createdAt: new Date("2026-01-01T12:00:00.000Z"),
                id: "two-two",
            },
        ]

        const result = getLatestVerseByChapter(rows, { chapterOnly: true })

        expect(result.get("1")?.id).toBe("two-one")
        expect(result.get("2")?.id).toBe("two-two")
        expect(result.get("2:1")).toBeUndefined()
    })
})
