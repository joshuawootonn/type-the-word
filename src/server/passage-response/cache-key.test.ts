import { describe, expect, it } from "vitest"

import { toPassageResponseCacheKey } from "./cache-key"

describe("toPassageResponseCacheKey", () => {
    it("uses 0/0 verse bounds for chapter cache entries", () => {
        const key = toPassageResponseCacheKey(
            {
                book: "romans",
                chapter: 8,
                firstVerse: 1,
            },
            "nkjv",
        )

        expect(key).toEqual({
            translation: "nkjv",
            book: "romans",
            chapter: 8,
            firstVerse: 0,
            lastVerse: 0,
        })
    })

    it("uses explicit verse bounds for subsection cache entries", () => {
        const key = toPassageResponseCacheKey(
            {
                book: "romans",
                chapter: 8,
                firstVerse: 38,
                lastVerse: 39,
            },
            "nkjv",
        )

        expect(key).toEqual({
            translation: "nkjv",
            book: "romans",
            chapter: 8,
            firstVerse: 38,
            lastVerse: 39,
        })
    })
})
