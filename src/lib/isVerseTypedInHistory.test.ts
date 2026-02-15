import { describe, expect, test } from "vitest"

import { AssignmentHistory } from "~/app/api/assignment-history/[assignmentId]/getAssignmentHistory"
import { ChapterHistory } from "~/app/api/chapter-history/[passage]/route"

import { isVerseTypedInHistory } from "./isVerseTypedInHistory"

describe("isVerseTypedInHistory", () => {
    test.concurrent("returns false when history is undefined", () => {
        expect(isVerseTypedInHistory(undefined, 1, 1)).toBe(false)
    })

    test.concurrent("returns true for chapter history verse keys", () => {
        const history: ChapterHistory = {
            verses: { 3: true },
            chapterLogs: [],
        }

        expect(isVerseTypedInHistory(history, 1, 3)).toBe(true)
    })

    test.concurrent("returns true for assignment history chapter:verse keys", () => {
        const history: AssignmentHistory = {
            verses: {
                "2:4": { wpm: 50, accuracy: 98 },
            },
            chapterLogs: [],
        }

        expect(isVerseTypedInHistory(history, 2, 4)).toBe(true)
    })

    test.concurrent("supports legacy assignment-history verse-only keys", () => {
        const history: AssignmentHistory = {
            verses: {
                "4": { wpm: 48, accuracy: 91 },
            },
            chapterLogs: [],
        }

        expect(isVerseTypedInHistory(history, 9, 4)).toBe(true)
    })

    test.concurrent("returns false when no matching verse key exists", () => {
        const history: AssignmentHistory = {
            verses: {
                "1:1": { wpm: 50, accuracy: 98 },
            },
            chapterLogs: [],
        }

        expect(isVerseTypedInHistory(history, 2, 1)).toBe(false)
    })
})
