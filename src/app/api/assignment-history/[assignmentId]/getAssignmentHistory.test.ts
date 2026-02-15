import { describe, expect, test } from "vitest"

import { getLatestVersesByLocation } from "./verse-location"

describe("getLatestVersesByLocation", () => {
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

        const result = getLatestVersesByLocation(rows)

        expect(result.size).toBe(2)
        expect(result.get("1:1")?.id).toBe("new-1-1")
        expect(result.get("2:1")?.id).toBe("only-2-1")
    })
})
