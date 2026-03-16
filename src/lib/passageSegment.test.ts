import { describe, expect, it } from "vitest"

import { safeDecodePassageSegment } from "./passageSegment"

describe("safeDecodePassageSegment", () => {
    it("decodes encoded verse separators", () => {
        expect(safeDecodePassageSegment("romans_8%3a1-2")).toBe("romans_8:1-2")
    })

    it("returns original text for plain segments", () => {
        expect(safeDecodePassageSegment("romans_8:1-2")).toBe("romans_8:1-2")
    })

    it("falls back when decode fails", () => {
        expect(safeDecodePassageSegment("romans_8%ZZ1-2")).toBe(
            "romans_8%ZZ1-2",
        )
    })
})
