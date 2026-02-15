import { describe, expect, test } from "vitest"

import {
    buildAssignmentChapterSegments,
    getActiveChapterIndex,
} from "./chapter-segments"

const mockMetadata = {
    genesis: {
        chapters: [{ length: 31 }, { length: 25 }, { length: 24 }, { length: 26 }],
    },
}

describe("buildAssignmentChapterSegments", () => {
    test.concurrent("builds a single-chapter slice with provided verse bounds", () => {
        const segments = buildAssignmentChapterSegments({
            book: "genesis",
            startChapter: 2,
            startVerse: 3,
            endChapter: 2,
            endVerse: 10,
            metadata: mockMetadata,
        })

        expect(segments).toHaveLength(1)
        expect(segments[0]).toMatchObject({
            chapter: 2,
            startVerse: 3,
            endVerse: 10,
            passageSegment: "genesis_2",
        })
    })

    test.concurrent("builds multi-chapter slices with first and last chapter bounds", () => {
        const segments = buildAssignmentChapterSegments({
            book: "genesis",
            startChapter: 1,
            startVerse: 5,
            endChapter: 3,
            endVerse: 8,
            metadata: mockMetadata,
        })

        expect(segments).toHaveLength(3)
        expect(segments[0]).toMatchObject({
            chapter: 1,
            startVerse: 5,
            endVerse: 31,
        })
        expect(segments[1]).toMatchObject({
            chapter: 2,
            startVerse: 1,
            endVerse: 25,
        })
        expect(segments[2]).toMatchObject({
            chapter: 3,
            startVerse: 1,
            endVerse: 8,
        })
    })

    test.concurrent("clamps chapter and verse boundaries to valid metadata range", () => {
        const segments = buildAssignmentChapterSegments({
            book: "genesis",
            startChapter: 0,
            startVerse: 0,
            endChapter: 99,
            endVerse: 999,
            metadata: mockMetadata,
        })

        expect(segments).toHaveLength(4)
        expect(segments[0]).toMatchObject({
            chapter: 1,
            startVerse: 1,
            endVerse: 31,
        })
        expect(segments[3]).toMatchObject({
            chapter: 4,
            startVerse: 1,
            endVerse: 26,
        })
    })
})

describe("getActiveChapterIndex", () => {
    const segments = buildAssignmentChapterSegments({
        book: "genesis",
        startChapter: 2,
        startVerse: 1,
        endChapter: 4,
        endVerse: 10,
        metadata: mockMetadata,
    })

    test.concurrent("defaults to first chapter when no query param is provided", () => {
        expect(getActiveChapterIndex(segments, undefined)).toBe(0)
    })

    test.concurrent("clamps query chapter below range to the first chapter", () => {
        expect(getActiveChapterIndex(segments, "1")).toBe(0)
    })

    test.concurrent("clamps query chapter above range to the last chapter", () => {
        expect(getActiveChapterIndex(segments, "999")).toBe(2)
    })

    test.concurrent("selects the matching chapter when query param is valid", () => {
        expect(getActiveChapterIndex(segments, "3")).toBe(1)
    })
})
