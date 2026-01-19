import { describe, expect, it } from "vitest"

import { TypingData } from "~/server/db/schema"
import { TypedVerse } from "~/server/repositories/typingSession.repository"

import {
    calculateEffectiveDuration,
    getValidActionsAfterReset,
    calculateAccuracy,
    calculateCorrectedAccuracy,
    calculateStatsForVerse,
} from "./wpm"

// Helper to create action with datetime
function createAction(
    type: TypingData["userActions"][number]["type"],
    datetime: string,
    key = "a",
): TypingData["userActions"][number] {
    return { type, datetime, key }
}

// Helper to create a typed verse with typing data
function createTypedVerse(typingData: TypingData): TypedVerse {
    return {
        id: "test-id",
        userId: "test-user",
        typingSessionId: "test-session",
        translation: "esv",
        book: "genesis",
        chapter: 1,
        verse: 1,
        createdAt: new Date(),
        typingData,
    }
}

describe("getValidActionsAfterReset", () => {
    it("returns all actions when no deleteSoftLineBackward exists", () => {
        const actions = [
            createAction("insertText", "2024-01-01T00:00:00.000Z"),
            createAction("insertText", "2024-01-01T00:00:01.000Z"),
            createAction("insertText", "2024-01-01T00:00:02.000Z"),
        ]

        const result = getValidActionsAfterReset(actions)

        expect(result).toHaveLength(3)
        expect(result).toEqual(actions)
    })

    it("returns only actions after the last deleteSoftLineBackward", () => {
        const actions = [
            createAction("insertText", "2024-01-01T00:00:00.000Z"),
            createAction("insertText", "2024-01-01T00:00:01.000Z"),
            createAction("deleteSoftLineBackward", "2024-01-01T00:00:02.000Z"),
            createAction("insertText", "2024-01-01T00:00:03.000Z"),
            createAction("insertText", "2024-01-01T00:00:04.000Z"),
        ]

        const result = getValidActionsAfterReset(actions)

        expect(result).toHaveLength(2)
        expect(result[0]?.datetime).toBe("2024-01-01T00:00:03.000Z")
        expect(result[1]?.datetime).toBe("2024-01-01T00:00:04.000Z")
    })

    it("uses only actions after the LAST deleteSoftLineBackward when multiple exist", () => {
        const actions = [
            createAction("insertText", "2024-01-01T00:00:00.000Z"),
            createAction("deleteSoftLineBackward", "2024-01-01T00:00:01.000Z"),
            createAction("insertText", "2024-01-01T00:00:02.000Z"),
            createAction("deleteSoftLineBackward", "2024-01-01T00:00:03.000Z"),
            createAction("insertText", "2024-01-01T00:00:04.000Z"),
            createAction("insertText", "2024-01-01T00:00:05.000Z"),
        ]

        const result = getValidActionsAfterReset(actions)

        expect(result).toHaveLength(2)
        expect(result[0]?.datetime).toBe("2024-01-01T00:00:04.000Z")
    })

    it("returns 1 action when fewer than 2 actions exist after deleteSoftLineBackward", () => {
        const actions = [
            createAction("insertText", "2024-01-01T00:00:00.000Z"),
            createAction("insertText", "2024-01-01T00:00:01.000Z"),
            createAction("deleteSoftLineBackward", "2024-01-01T00:00:02.000Z"),
            createAction("insertText", "2024-01-01T00:00:03.000Z"),
        ]

        const result = getValidActionsAfterReset(actions)

        expect(result).toHaveLength(1)
        expect(result[0]?.datetime).toBe("2024-01-01T00:00:03.000Z")
    })

    it("returns empty array when deleteSoftLineBackward is the last action", () => {
        const actions = [
            createAction("insertText", "2024-01-01T00:00:00.000Z"),
            createAction("insertText", "2024-01-01T00:00:01.000Z"),
            createAction("deleteSoftLineBackward", "2024-01-01T00:00:02.000Z"),
        ]

        const result = getValidActionsAfterReset(actions)

        expect(result).toHaveLength(0)
    })

    it("returns all actions when fewer than 2 actions total (no reset)", () => {
        const actions = [createAction("insertText", "2024-01-01T00:00:00.000Z")]

        const result = getValidActionsAfterReset(actions)

        expect(result).toHaveLength(1)
    })
})

describe("calculateEffectiveDuration", () => {
    it("returns 0 for fewer than 2 actions", () => {
        const actions = [createAction("insertText", "2024-01-01T00:00:00.000Z")]

        expect(calculateEffectiveDuration(actions)).toBe(0)
        expect(calculateEffectiveDuration([])).toBe(0)
    })

    it("calculates total duration for continuous typing (no pauses)", () => {
        const actions = [
            createAction("insertText", "2024-01-01T00:00:00.000Z"),
            createAction("insertText", "2024-01-01T00:00:01.000Z"),
            createAction("insertText", "2024-01-01T00:00:02.000Z"),
        ]

        // 2 seconds total (0->1, 1->2)
        expect(calculateEffectiveDuration(actions)).toBe(2000)
    })

    it("caps pause time at 1 second when gap exceeds 3 seconds", () => {
        const actions = [
            createAction("insertText", "2024-01-01T00:00:00.000Z"),
            createAction("insertText", "2024-01-01T00:00:10.000Z"), // 10 second gap
        ]

        // 10 second gap > 3 seconds, so only count 1 second
        expect(calculateEffectiveDuration(actions)).toBe(1000)
    })

    it("counts full time for gaps under 3 seconds", () => {
        const actions = [
            createAction("insertText", "2024-01-01T00:00:00.000Z"),
            createAction("insertText", "2024-01-01T00:00:02.500Z"), // 2.5 second gap
        ]

        // 2.5 seconds < 3 seconds threshold, so count full time
        expect(calculateEffectiveDuration(actions)).toBe(2500)
    })

    it("handles exactly 3 second gaps as normal typing", () => {
        const actions = [
            createAction("insertText", "2024-01-01T00:00:00.000Z"),
            createAction("insertText", "2024-01-01T00:00:03.000Z"), // exactly 3 second gap
        ]

        // Exactly 3 seconds is NOT > 3 seconds, so count full time
        expect(calculateEffectiveDuration(actions)).toBe(3000)
    })

    it("handles multiple pauses correctly", () => {
        const actions = [
            createAction("insertText", "2024-01-01T00:00:00.000Z"),
            createAction("insertText", "2024-01-01T00:00:01.000Z"), // 1s - normal
            createAction("insertText", "2024-01-01T00:00:06.000Z"), // 5s - pause (count 1s)
            createAction("insertText", "2024-01-01T00:00:07.000Z"), // 1s - normal
            createAction("insertText", "2024-01-01T00:00:17.000Z"), // 10s - pause (count 1s)
        ]

        // 1000 + 1000 (capped from 5000) + 1000 + 1000 (capped from 10000) = 4000
        expect(calculateEffectiveDuration(actions)).toBe(4000)
    })

    it("handles mixed normal typing and pauses", () => {
        const actions = [
            createAction("insertText", "2024-01-01T00:00:00.000Z"),
            createAction("insertText", "2024-01-01T00:00:00.500Z"), // 500ms - normal
            createAction("insertText", "2024-01-01T00:00:01.000Z"), // 500ms - normal
            createAction("insertText", "2024-01-01T00:00:10.000Z"), // 9s - pause (count 1s)
            createAction("insertText", "2024-01-01T00:00:10.200Z"), // 200ms - normal
        ]

        // 500 + 500 + 1000 (capped from 9000) + 200 = 2200
        expect(calculateEffectiveDuration(actions)).toBe(2200)
    })
})

describe("calculateCorrectedAccuracy", () => {
    it("returns 100% when all letters match", () => {
        const typingData: TypingData = {
            userActions: [],
            userNodes: [{ type: "word", letters: ["h", "e", "l", "l", "o"] }],
            correctNodes: [
                { type: "word", letters: ["h", "e", "l", "l", "o"] },
            ],
        }

        expect(calculateCorrectedAccuracy(typingData)).toBe(100)
    })

    it("returns 0% when no letters match", () => {
        const typingData: TypingData = {
            userActions: [],
            userNodes: [{ type: "word", letters: ["x", "x", "x", "x", "x"] }],
            correctNodes: [
                { type: "word", letters: ["h", "e", "l", "l", "o"] },
            ],
        }

        expect(calculateCorrectedAccuracy(typingData)).toBe(0)
    })

    it("calculates partial accuracy correctly", () => {
        const typingData: TypingData = {
            userActions: [],
            userNodes: [{ type: "word", letters: ["h", "e", "x", "x", "o"] }],
            correctNodes: [
                { type: "word", letters: ["h", "e", "l", "l", "o"] },
            ],
        }

        // 3 out of 5 correct = 60%
        expect(calculateCorrectedAccuracy(typingData)).toBe(60)
    })

    it("handles multiple words", () => {
        const typingData: TypingData = {
            userActions: [],
            userNodes: [
                { type: "word", letters: ["h", "i"] },
                { type: "word", letters: ["b", "y", "e"] },
            ],
            correctNodes: [
                { type: "word", letters: ["h", "i"] },
                { type: "word", letters: ["b", "y", "e"] },
            ],
        }

        expect(calculateCorrectedAccuracy(typingData)).toBe(100)
    })

    it("returns 0 when correctNodes is empty", () => {
        const typingData: TypingData = {
            userActions: [],
            userNodes: [{ type: "word", letters: ["h", "i"] }],
            correctNodes: [],
        }

        expect(calculateCorrectedAccuracy(typingData)).toBe(0)
    })
})

describe("calculateAccuracy (Monkeytype-style)", () => {
    // @see https://github.com/monkeytypegame/monkeytype/blob/master/frontend/src/ts/test/test-stats.ts

    it("returns 100% when all keystrokes are correct", () => {
        const typingData: TypingData = {
            userActions: [
                createAction("insertText", "2024-01-01T00:00:00.000Z", "t"),
                createAction("insertText", "2024-01-01T00:00:00.100Z", "h"),
                createAction("insertText", "2024-01-01T00:00:00.200Z", "e"),
            ],
            userNodes: [{ type: "word", letters: ["t", "h", "e"] }],
            correctNodes: [{ type: "word", letters: ["t", "h", "e"] }],
        }

        expect(calculateAccuracy(typingData)).toBe(100)
    })

    it("returns 0% when all keystrokes are incorrect", () => {
        const typingData: TypingData = {
            userActions: [
                createAction("insertText", "2024-01-01T00:00:00.000Z", "x"),
                createAction("insertText", "2024-01-01T00:00:00.100Z", "y"),
                createAction("insertText", "2024-01-01T00:00:00.200Z", "z"),
            ],
            userNodes: [{ type: "word", letters: ["x", "y", "z"] }],
            correctNodes: [{ type: "word", letters: ["t", "h", "e"] }],
        }

        expect(calculateAccuracy(typingData)).toBe(0)
    })

    it("counts corrected mistakes against accuracy", () => {
        // Type "teh", backspace twice, then type "he"
        // Keystrokes: t(correct), e(wrong), h(wrong), backspace, backspace, h(correct), e(correct)
        // Correct: 3, Incorrect: 2, Total: 5
        // Accuracy: 3/5 = 60%
        const typingData: TypingData = {
            userActions: [
                createAction("insertText", "2024-01-01T00:00:00.000Z", "t"), // correct
                createAction("insertText", "2024-01-01T00:00:00.100Z", "e"), // wrong (expected 'h')
                createAction("insertText", "2024-01-01T00:00:00.200Z", "h"), // wrong (expected 'e')
                createAction(
                    "deleteContentBackward",
                    "2024-01-01T00:00:00.300Z",
                ),
                createAction(
                    "deleteContentBackward",
                    "2024-01-01T00:00:00.400Z",
                ),
                createAction("insertText", "2024-01-01T00:00:00.500Z", "h"), // correct
                createAction("insertText", "2024-01-01T00:00:00.600Z", "e"), // correct
            ],
            userNodes: [{ type: "word", letters: ["t", "h", "e"] }],
            correctNodes: [{ type: "word", letters: ["t", "h", "e"] }],
        }

        expect(calculateAccuracy(typingData)).toBe(60)
    })

    it("handles single character correction", () => {
        // Type "helo", backspace, type "lo"
        // h(correct), e(correct), l(correct), o(wrong - expected 'l'), backspace, l(correct), o(correct)
        // Correct: 5, Incorrect: 1, Total: 6
        // Accuracy: 5/6 = 83%
        const typingData: TypingData = {
            userActions: [
                createAction("insertText", "2024-01-01T00:00:00.000Z", "h"),
                createAction("insertText", "2024-01-01T00:00:00.100Z", "e"),
                createAction("insertText", "2024-01-01T00:00:00.200Z", "l"),
                createAction("insertText", "2024-01-01T00:00:00.300Z", "o"), // wrong
                createAction(
                    "deleteContentBackward",
                    "2024-01-01T00:00:00.400Z",
                ),
                createAction("insertText", "2024-01-01T00:00:00.500Z", "l"),
                createAction("insertText", "2024-01-01T00:00:00.600Z", "o"),
            ],
            userNodes: [{ type: "word", letters: ["h", "e", "l", "l", "o"] }],
            correctNodes: [
                { type: "word", letters: ["h", "e", "l", "l", "o"] },
            ],
        }

        expect(calculateAccuracy(typingData)).toBe(83)
    })

    it("handles deleteWordBackward correctly", () => {
        // Type "the cat", delete "cat" with word delete, type "dog"
        // deleteWordBackward deletes back to the last space
        const typingData: TypingData = {
            userActions: [
                createAction("insertText", "2024-01-01T00:00:00.000Z", "t"),
                createAction("insertText", "2024-01-01T00:00:00.100Z", "h"),
                createAction("insertText", "2024-01-01T00:00:00.200Z", "e"),
                createAction("insertText", "2024-01-01T00:00:00.300Z", " "), // space
                createAction("insertText", "2024-01-01T00:00:00.400Z", "c"), // wrong (expected 'd')
                createAction("insertText", "2024-01-01T00:00:00.500Z", "a"), // wrong (expected 'o')
                createAction("insertText", "2024-01-01T00:00:00.600Z", "t"), // wrong (expected 'g')
                createAction("deleteWordBackward", "2024-01-01T00:00:00.700Z"), // deletes "cat", position goes from 7 to 4
                createAction("insertText", "2024-01-01T00:00:00.800Z", "d"), // position 4 (expected 'd')
                createAction("insertText", "2024-01-01T00:00:00.900Z", "o"), // position 5 (expected 'o')
                createAction("insertText", "2024-01-01T00:00:01.000Z", "g"), // position 6 (expected 'g')
            ],
            userNodes: [
                { type: "word", letters: ["t", "h", "e"] },
                { type: "word", letters: ["d", "o", "g"] },
            ],
            // correctNodes flatten to: ['t', 'h', 'e', 'd', 'o', 'g']
            // But userActions include a space at position 3
            correctNodes: [
                { type: "word", letters: ["t", "h", "e", " ", "d", "o", "g"] },
            ],
        }

        // t@0(correct), h@1(correct), e@2(correct), ' '@3(correct),
        // c@4(wrong), a@5(wrong), t@6(wrong),
        // deleteWordBackward -> position=4, currentText="the "
        // d@4(correct), o@5(correct), g@6(correct)
        // Correct: 7, Incorrect: 3, Total: 10
        // Accuracy: 7/10 = 70%
        expect(calculateAccuracy(typingData)).toBe(70)
    })

    it("ignores actions before deleteSoftLineBackward", () => {
        // Make lots of mistakes, reset with deleteSoftLineBackward, then type correctly
        const typingData: TypingData = {
            userActions: [
                createAction("insertText", "2024-01-01T00:00:00.000Z", "x"),
                createAction("insertText", "2024-01-01T00:00:00.100Z", "y"),
                createAction("insertText", "2024-01-01T00:00:00.200Z", "z"),
                createAction(
                    "deleteSoftLineBackward",
                    "2024-01-01T00:00:00.300Z",
                ),
                // Only these should count
                createAction("insertText", "2024-01-01T00:00:00.400Z", "t"),
                createAction("insertText", "2024-01-01T00:00:00.500Z", "h"),
                createAction("insertText", "2024-01-01T00:00:00.600Z", "e"),
            ],
            userNodes: [{ type: "word", letters: ["t", "h", "e"] }],
            correctNodes: [{ type: "word", letters: ["t", "h", "e"] }],
        }

        expect(calculateAccuracy(typingData)).toBe(100)
    })

    it("returns 100 when no keystrokes", () => {
        const typingData: TypingData = {
            userActions: [],
            userNodes: [],
            correctNodes: [{ type: "word", letters: ["t", "h", "e"] }],
        }

        expect(calculateAccuracy(typingData)).toBe(100)
    })

    it("returns 0 when correctNodes is empty", () => {
        const typingData: TypingData = {
            userActions: [
                createAction("insertText", "2024-01-01T00:00:00.000Z", "a"),
            ],
            userNodes: [{ type: "word", letters: ["a"] }],
            correctNodes: [],
        }

        expect(calculateAccuracy(typingData)).toBe(0)
    })

    it("handles typing beyond expected length", () => {
        // Type "thee" when expecting "the"
        // t(correct), h(correct), e(correct), e(no expected char - incorrect)
        const typingData: TypingData = {
            userActions: [
                createAction("insertText", "2024-01-01T00:00:00.000Z", "t"),
                createAction("insertText", "2024-01-01T00:00:00.100Z", "h"),
                createAction("insertText", "2024-01-01T00:00:00.200Z", "e"),
                createAction("insertText", "2024-01-01T00:00:00.300Z", "e"), // extra
            ],
            userNodes: [{ type: "word", letters: ["t", "h", "e", "e"] }],
            correctNodes: [{ type: "word", letters: ["t", "h", "e"] }],
        }

        // Correct: 3, Incorrect: 1, Total: 4
        // Accuracy: 3/4 = 75%
        expect(calculateAccuracy(typingData)).toBe(75)
    })
})

describe("calculateStatsForVerse", () => {
    it("calculates WPM correctly for normal typing", () => {
        // 10 letters typed in 2 seconds = 10/5 = 2 words in 2/60 minutes
        // WPM = 2 / (2/60) = 60 WPM
        // Use multiple actions with small gaps to avoid pause detection
        const typingData: TypingData = {
            userActions: [
                createAction("insertText", "2024-01-01T00:00:00.000Z", "a"),
                createAction("insertText", "2024-01-01T00:00:00.500Z", "b"),
                createAction("insertText", "2024-01-01T00:00:01.000Z", "c"),
                createAction("insertText", "2024-01-01T00:00:01.500Z", "d"),
                createAction("insertText", "2024-01-01T00:00:02.000Z", "e"),
            ],
            userNodes: [{ type: "word", letters: ["a", "b", "c", "d", "e"] }],
            correctNodes: [
                { type: "word", letters: ["a", "b", "c", "d", "e"] },
            ],
        }

        const result = calculateStatsForVerse(createTypedVerse(typingData))

        expect(result).not.toBeNull()
        // 5 letters / 5 = 1 word in 2 seconds (0.0333 min) = 30 WPM
        expect(result!.wpm).toBe(30)
        expect(result!.accuracy).toBe(100)
    })

    it("returns null when deleteSoftLineBackward invalidates most actions", () => {
        const typingData: TypingData = {
            userActions: [
                createAction("insertText", "2024-01-01T00:00:00.000Z", "x"),
                createAction("insertText", "2024-01-01T00:00:01.000Z", "y"),
                createAction(
                    "deleteSoftLineBackward",
                    "2024-01-01T00:00:02.000Z",
                ),
                createAction("insertText", "2024-01-01T00:00:03.000Z", "h"),
            ],
            userNodes: [{ type: "word", letters: ["h", "i"] }],
            correctNodes: [{ type: "word", letters: ["h", "i"] }],
        }

        const result = calculateStatsForVerse(createTypedVerse(typingData))

        // Only 1 action after deleteSoftLineBackward, need at least 2
        expect(result).toBeNull()
    })

    it("calculates WPM only from actions after deleteSoftLineBackward", () => {
        // After reset: 3 seconds of typing
        // 5 letters / 5 = 1 word in 3/60 minutes = 20 WPM
        const typingData: TypingData = {
            userActions: [
                createAction("insertText", "2024-01-01T00:00:00.000Z", "x"),
                createAction("insertText", "2024-01-01T00:00:01.000Z", "y"),
                createAction(
                    "deleteSoftLineBackward",
                    "2024-01-01T00:00:02.000Z",
                ),
                // After reset - these are the only actions that count
                createAction("insertText", "2024-01-01T00:00:03.000Z", "a"),
                createAction("insertText", "2024-01-01T00:00:04.000Z", "b"),
                createAction("insertText", "2024-01-01T00:00:05.000Z", "c"),
                createAction("insertText", "2024-01-01T00:00:06.000Z", "d"), // 3 seconds total
            ],
            userNodes: [{ type: "word", letters: ["a", "b", "c", "d"] }],
            correctNodes: [{ type: "word", letters: ["a", "b", "c", "d"] }],
        }

        const result = calculateStatsForVerse(createTypedVerse(typingData))

        expect(result).not.toBeNull()
        // 4 letters / 5 = 0.8 words in 3 seconds (0.05 min) = 16 WPM
        expect(result!.wpm).toBe(16)
    })

    it("accounts for pause time correctly", () => {
        // 4 letters, with a 10-second pause that should only count as 1 second
        // Total effective time: 2 + 1 (pause) + 2 = 5 seconds
        const typingData: TypingData = {
            userActions: [
                createAction("insertText", "2024-01-01T00:00:00.000Z", "a"),
                createAction("insertText", "2024-01-01T00:00:02.000Z", "b"), // 2 sec
                createAction("insertText", "2024-01-01T00:00:12.000Z", "c"), // 10 sec pause -> 1 sec
                createAction("insertText", "2024-01-01T00:00:14.000Z", "d"), // 2 sec
            ],
            userNodes: [{ type: "word", letters: ["a", "b", "c", "d"] }],
            correctNodes: [{ type: "word", letters: ["a", "b", "c", "d"] }],
        }

        const result = calculateStatsForVerse(createTypedVerse(typingData))

        expect(result).not.toBeNull()
        // 4 letters / 5 = 0.8 words in 5 seconds (0.0833 min) = 9.6 -> 10 WPM
        expect(result!.wpm).toBe(10)
    })

    it("returns null for null typing data", () => {
        const typedVerse = createTypedVerse({
            userActions: [],
            userNodes: [],
            correctNodes: [],
        })
        typedVerse.typingData = null

        const result = calculateStatsForVerse(typedVerse)

        expect(result).toBeNull()
    })

    it("returns null when duration is less than 1 second", () => {
        const typingData: TypingData = {
            userActions: [
                createAction("insertText", "2024-01-01T00:00:00.000Z", "h"),
                createAction("insertText", "2024-01-01T00:00:00.500Z", "i"),
            ],
            userNodes: [{ type: "word", letters: ["h", "i"] }],
            correctNodes: [{ type: "word", letters: ["h", "i"] }],
        }

        const result = calculateStatsForVerse(createTypedVerse(typingData))

        expect(result).toBeNull()
    })
})
