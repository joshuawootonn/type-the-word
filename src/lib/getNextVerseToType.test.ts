import { describe, expect, test } from "vitest"

import { AssignmentHistory } from "~/app/api/assignment-history/[assignmentId]/getAssignmentHistory"
import { ChapterHistory } from "~/app/api/chapter-history/[passage]/route"

import { getNextVerseToType } from "./getNextVerseToType"
import { ParsedPassage, Verse, VerseNumber } from "./parseEsv"

// Helper to create a mock verse
function createMockVerse(verseNum: number): Verse {
    const verseNumber: VerseNumber = {
        type: "verseNumber",
        value: `1:${verseNum}`,
        text: `${verseNum}`,
        verse: verseNum,
        chapter: 1,
        book: "genesis",
        translation: "esv",
    }

    return {
        type: "verse" as const,
        verse: verseNumber,
        text: `Mock text for verse ${verseNum}`,
        nodes: [],
        metadata: {
            hangingVerse: false,
            offset: 0,
            length: 10,
        },
    }
}

// Helper to create a mock passage with specified verses
function createMockPassage(verseNumbers: number[]): ParsedPassage {
    const verses = verseNumbers.map(createMockVerse)

    return {
        nodes: [
            {
                type: "paragraph",
                text: "Mock paragraph",
                nodes: verses,
                metadata: {
                    type: "default",
                    blockIndent: false,
                },
            },
        ],
        firstVerse: {
            type: "verseNumber",
            value: "1:1",
            text: "1",
            verse: 1,
            chapter: 1,
            book: "genesis",
            translation: "esv",
        },
        prevChapter: null,
        nextChapter: null,
        copyright: {
            text: "Mock copyright",
            abbreviation: "ESV",
            translation: "esv",
        },
    }
}

describe("getNextVerseToType", () => {
    test.concurrent("WHEN no chapter history THEN returns first verse", () => {
        const passage = createMockPassage([1, 2, 3, 4, 5])

        const result = getNextVerseToType(passage, undefined)

        expect(result).toBe("1")
    })

    test.concurrent("WHEN no verses typed THEN returns first verse", () => {
        const passage = createMockPassage([1, 2, 3, 4, 5])
        const chapterHistory: ChapterHistory = {
            verses: {},
            chapterLogs: [],
        }

        const result = getNextVerseToType(passage, chapterHistory)

        expect(result).toBe("1")
    })

    test.concurrent("WHEN first verse typed THEN returns second verse", () => {
        const passage = createMockPassage([1, 2, 3, 4, 5])
        const chapterHistory: ChapterHistory = {
            verses: { 1: true },
            chapterLogs: [],
        }

        const result = getNextVerseToType(passage, chapterHistory)

        expect(result).toBe("2")
    })

    test.concurrent("WHEN first three verses typed THEN returns fourth verse", () => {
        const passage = createMockPassage([1, 2, 3, 4, 5])
        const chapterHistory: ChapterHistory = {
            verses: { 1: true, 2: true, 3: true },
            chapterLogs: [],
        }

        const result = getNextVerseToType(passage, chapterHistory)

        expect(result).toBe("4")
    })

    test.concurrent("WHEN all verses typed THEN returns first verse", () => {
        const passage = createMockPassage([1, 2, 3, 4, 5])
        const chapterHistory: ChapterHistory = {
            verses: { 1: true, 2: true, 3: true, 4: true, 5: true },
            chapterLogs: [],
        }

        const result = getNextVerseToType(passage, chapterHistory)

        expect(result).toBe("1")
    })

    test.concurrent("WHEN verses typed out of order THEN returns verse after highest typed", () => {
        const passage = createMockPassage([1, 2, 3, 4, 5])
        const chapterHistory: ChapterHistory = {
            verses: { 1: true, 3: true, 5: true },
            chapterLogs: [],
        }

        const result = getNextVerseToType(passage, chapterHistory)

        // Max typed is 5, so next should be beyond 5
        // Since there's no verse 6 in this passage, it should return first verse
        expect(result).toBe("1")
    })

    test.concurrent("WHEN middle verses untyped THEN returns first untyped", () => {
        const passage = createMockPassage([1, 2, 3, 4, 5])
        const chapterHistory: ChapterHistory = {
            verses: { 1: true, 2: true },
            chapterLogs: [],
        }

        const result = getNextVerseToType(passage, chapterHistory)

        expect(result).toBe("3")
    })

    test.concurrent("WHEN only last verse untyped THEN returns last verse", () => {
        const passage = createMockPassage([1, 2, 3, 4, 5])
        const chapterHistory: ChapterHistory = {
            verses: { 1: true, 2: true, 3: true, 4: true },
            chapterLogs: [],
        }

        const result = getNextVerseToType(passage, chapterHistory)

        expect(result).toBe("5")
    })

    test.concurrent("WHEN passage has hanging verses THEN skips them in counting", () => {
        const passage: ParsedPassage = {
            nodes: [
                {
                    type: "paragraph",
                    text: "Mock paragraph",
                    nodes: [
                        createMockVerse(1),
                        createMockVerse(2),
                        // Hanging verse continuation (same verse number, different paragraph)
                        {
                            ...createMockVerse(2),
                            metadata: {
                                hangingVerse: true,
                                offset: 20,
                                length: 5,
                            },
                        },
                        createMockVerse(3),
                    ],
                    metadata: {
                        type: "default",
                        blockIndent: false,
                    },
                },
            ],
            firstVerse: {
                type: "verseNumber",
                value: "1",
                text: "1",
                verse: 1,
                chapter: 1,
                book: "genesis",
                translation: "esv",
            },
            prevChapter: null,
            nextChapter: null,
            copyright: {
                text: "Mock copyright",
                abbreviation: "ESV",
                translation: "esv",
            },
        }
        const chapterHistory: ChapterHistory = {
            verses: { 1: true },
            chapterLogs: [],
        }

        const result = getNextVerseToType(passage, chapterHistory)

        // Should return verse 2, not count the hanging verse as separate
        expect(result).toBe("2")
    })

    test.concurrent("WHEN empty passage THEN returns first verse", () => {
        const passage: ParsedPassage = {
            nodes: [],
            firstVerse: {
                type: "verseNumber",
                value: "1:1",
                text: "1",
                verse: 1,
                chapter: 1,
                book: "genesis",
                translation: "esv",
            },
            prevChapter: null,
            nextChapter: null,
            copyright: {
                text: "Mock copyright",
                abbreviation: "ESV",
                translation: "esv",
            },
        }
        const chapterHistory: ChapterHistory = {
            verses: {},
            chapterLogs: [],
        }

        const result = getNextVerseToType(passage, chapterHistory)

        expect(result).toBe("1")
    })

    test.concurrent("WHEN only verse 5 typed THEN returns verse 6", () => {
        const passage = createMockPassage([1, 2, 3, 4, 5, 6, 7])
        const chapterHistory: ChapterHistory = {
            verses: { 5: true },
            chapterLogs: [],
        }

        const result = getNextVerseToType(passage, chapterHistory)

        expect(result).toBe("6")
    })

    test.concurrent("WHEN non-sequential verses typed THEN returns verse after highest", () => {
        const passage = createMockPassage([1, 2, 3, 4, 5, 6, 7, 8])
        const chapterHistory: ChapterHistory = {
            verses: { 2: true, 5: true, 3: true },
            chapterLogs: [],
        }

        const result = getNextVerseToType(passage, chapterHistory)

        // Highest typed is 5, so next should be 6
        expect(result).toBe("6")
    })

    test.concurrent("WHEN highest typed verse is last in chapter THEN returns first verse", () => {
        const passage = createMockPassage([1, 2, 3, 4, 5])
        const chapterHistory: ChapterHistory = {
            verses: { 5: true },
            chapterLogs: [],
        }

        const result = getNextVerseToType(passage, chapterHistory)

        // Verse 5 is the last verse, so go back to first
        expect(result).toBe("1")
    })

    test.concurrent("WHEN assignment history uses chapter:verse keys THEN resolves next verse in current chapter", () => {
        const passage = createMockPassage([1, 2, 3, 4, 5])
        const assignmentHistory: AssignmentHistory = {
            verses: {
                "1:1": { wpm: 55, accuracy: 98 },
                "1:2": { wpm: 60, accuracy: 99 },
                "2:1": { wpm: 52, accuracy: 95 },
            },
            chapterLogs: [],
        }

        const result = getNextVerseToType(passage, assignmentHistory)

        expect(result).toBe("3")
    })

    test.concurrent("WHEN assignment history has no typed verses in current chapter THEN returns first verse", () => {
        const passage = createMockPassage([1, 2, 3])
        const assignmentHistory: AssignmentHistory = {
            verses: {
                "2:1": { wpm: 40, accuracy: 90 },
                "2:2": { wpm: 42, accuracy: 91 },
            },
            chapterLogs: [],
        }

        const result = getNextVerseToType(passage, assignmentHistory)

        expect(result).toBe("1")
    })

    test.concurrent("WHEN assignment history has malformed keys THEN ignores them", () => {
        const passage = createMockPassage([1, 2, 3, 4])
        const assignmentHistory: AssignmentHistory = {
            verses: {
                abc: { wpm: 40, accuracy: 90 },
                "1:not-a-number": { wpm: 41, accuracy: 91 },
                "1:2": { wpm: 42, accuracy: 92 },
            },
            chapterLogs: [],
        }

        const result = getNextVerseToType(passage, assignmentHistory)

        expect(result).toBe("3")
    })

    test.concurrent("WHEN assignment history includes legacy verse-only keys THEN handles them", () => {
        const passage = createMockPassage([1, 2, 3, 4])
        const assignmentHistory: AssignmentHistory = {
            verses: {
                "1": { wpm: 40, accuracy: 90 },
            },
            chapterLogs: [],
        }

        const result = getNextVerseToType(passage, assignmentHistory)

        expect(result).toBe("2")
    })
})
