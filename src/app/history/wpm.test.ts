import { describe, expect, it } from 'vitest'

import { TypingData } from '~/server/db/schema'
import { TypedVerse } from '~/server/repositories/typingSession.repository'

import {
    calculateEffectiveDuration,
    getValidActionsAfterReset,
    calculateAccuracy,
    calculateStatsForVerse,
} from './wpm'

// Helper to create action with datetime
function createAction(
    type: TypingData['userActions'][number]['type'],
    datetime: string,
    key = 'a',
): TypingData['userActions'][number] {
    return { type, datetime, key }
}

// Helper to create a typed verse with typing data
function createTypedVerse(typingData: TypingData): TypedVerse {
    return {
        id: 'test-id',
        userId: 'test-user',
        typingSessionId: 'test-session',
        translation: 'esv',
        book: 'genesis',
        chapter: 1,
        verse: 1,
        createdAt: new Date(),
        typingData,
    }
}

describe('getValidActionsAfterReset', () => {
    it('returns all actions when no deleteSoftLineBackward exists', () => {
        const actions = [
            createAction('insertText', '2024-01-01T00:00:00.000Z'),
            createAction('insertText', '2024-01-01T00:00:01.000Z'),
            createAction('insertText', '2024-01-01T00:00:02.000Z'),
        ]

        const result = getValidActionsAfterReset(actions)

        expect(result).toHaveLength(3)
        expect(result).toEqual(actions)
    })

    it('returns only actions after the last deleteSoftLineBackward', () => {
        const actions = [
            createAction('insertText', '2024-01-01T00:00:00.000Z'),
            createAction('insertText', '2024-01-01T00:00:01.000Z'),
            createAction('deleteSoftLineBackward', '2024-01-01T00:00:02.000Z'),
            createAction('insertText', '2024-01-01T00:00:03.000Z'),
            createAction('insertText', '2024-01-01T00:00:04.000Z'),
        ]

        const result = getValidActionsAfterReset(actions)

        expect(result).toHaveLength(2)
        expect(result![0]!.datetime).toBe('2024-01-01T00:00:03.000Z')
        expect(result![1]!.datetime).toBe('2024-01-01T00:00:04.000Z')
    })

    it('uses only actions after the LAST deleteSoftLineBackward when multiple exist', () => {
        const actions = [
            createAction('insertText', '2024-01-01T00:00:00.000Z'),
            createAction('deleteSoftLineBackward', '2024-01-01T00:00:01.000Z'),
            createAction('insertText', '2024-01-01T00:00:02.000Z'),
            createAction('deleteSoftLineBackward', '2024-01-01T00:00:03.000Z'),
            createAction('insertText', '2024-01-01T00:00:04.000Z'),
            createAction('insertText', '2024-01-01T00:00:05.000Z'),
        ]

        const result = getValidActionsAfterReset(actions)

        expect(result).toHaveLength(2)
        expect(result![0]!.datetime).toBe('2024-01-01T00:00:04.000Z')
    })

    it('returns null when fewer than 2 actions exist after deleteSoftLineBackward', () => {
        const actions = [
            createAction('insertText', '2024-01-01T00:00:00.000Z'),
            createAction('insertText', '2024-01-01T00:00:01.000Z'),
            createAction('deleteSoftLineBackward', '2024-01-01T00:00:02.000Z'),
            createAction('insertText', '2024-01-01T00:00:03.000Z'),
        ]

        const result = getValidActionsAfterReset(actions)

        expect(result).toBeNull()
    })

    it('returns null when deleteSoftLineBackward is the last action', () => {
        const actions = [
            createAction('insertText', '2024-01-01T00:00:00.000Z'),
            createAction('insertText', '2024-01-01T00:00:01.000Z'),
            createAction('deleteSoftLineBackward', '2024-01-01T00:00:02.000Z'),
        ]

        const result = getValidActionsAfterReset(actions)

        expect(result).toBeNull()
    })

    it('returns null when fewer than 2 actions total', () => {
        const actions = [createAction('insertText', '2024-01-01T00:00:00.000Z')]

        const result = getValidActionsAfterReset(actions)

        expect(result).toBeNull()
    })
})

describe('calculateEffectiveDuration', () => {
    it('returns 0 for fewer than 2 actions', () => {
        const actions = [createAction('insertText', '2024-01-01T00:00:00.000Z')]

        expect(calculateEffectiveDuration(actions)).toBe(0)
        expect(calculateEffectiveDuration([])).toBe(0)
    })

    it('calculates total duration for continuous typing (no pauses)', () => {
        const actions = [
            createAction('insertText', '2024-01-01T00:00:00.000Z'),
            createAction('insertText', '2024-01-01T00:00:01.000Z'),
            createAction('insertText', '2024-01-01T00:00:02.000Z'),
        ]

        // 2 seconds total (0->1, 1->2)
        expect(calculateEffectiveDuration(actions)).toBe(2000)
    })

    it('caps pause time at 1 second when gap exceeds 3 seconds', () => {
        const actions = [
            createAction('insertText', '2024-01-01T00:00:00.000Z'),
            createAction('insertText', '2024-01-01T00:00:10.000Z'), // 10 second gap
        ]

        // 10 second gap > 3 seconds, so only count 1 second
        expect(calculateEffectiveDuration(actions)).toBe(1000)
    })

    it('counts full time for gaps under 3 seconds', () => {
        const actions = [
            createAction('insertText', '2024-01-01T00:00:00.000Z'),
            createAction('insertText', '2024-01-01T00:00:02.500Z'), // 2.5 second gap
        ]

        // 2.5 seconds < 3 seconds threshold, so count full time
        expect(calculateEffectiveDuration(actions)).toBe(2500)
    })

    it('handles exactly 3 second gaps as normal typing', () => {
        const actions = [
            createAction('insertText', '2024-01-01T00:00:00.000Z'),
            createAction('insertText', '2024-01-01T00:00:03.000Z'), // exactly 3 second gap
        ]

        // Exactly 3 seconds is NOT > 3 seconds, so count full time
        expect(calculateEffectiveDuration(actions)).toBe(3000)
    })

    it('handles multiple pauses correctly', () => {
        const actions = [
            createAction('insertText', '2024-01-01T00:00:00.000Z'),
            createAction('insertText', '2024-01-01T00:00:01.000Z'), // 1s - normal
            createAction('insertText', '2024-01-01T00:00:06.000Z'), // 5s - pause (count 1s)
            createAction('insertText', '2024-01-01T00:00:07.000Z'), // 1s - normal
            createAction('insertText', '2024-01-01T00:00:17.000Z'), // 10s - pause (count 1s)
        ]

        // 1000 + 1000 (capped from 5000) + 1000 + 1000 (capped from 10000) = 4000
        expect(calculateEffectiveDuration(actions)).toBe(4000)
    })

    it('handles mixed normal typing and pauses', () => {
        const actions = [
            createAction('insertText', '2024-01-01T00:00:00.000Z'),
            createAction('insertText', '2024-01-01T00:00:00.500Z'), // 500ms - normal
            createAction('insertText', '2024-01-01T00:00:01.000Z'), // 500ms - normal
            createAction('insertText', '2024-01-01T00:00:10.000Z'), // 9s - pause (count 1s)
            createAction('insertText', '2024-01-01T00:00:10.200Z'), // 200ms - normal
        ]

        // 500 + 500 + 1000 (capped from 9000) + 200 = 2200
        expect(calculateEffectiveDuration(actions)).toBe(2200)
    })
})

describe('calculateAccuracy', () => {
    it('returns 100% when all letters match', () => {
        const typingData: TypingData = {
            userActions: [],
            userNodes: [{ type: 'word', letters: ['h', 'e', 'l', 'l', 'o'] }],
            correctNodes: [
                { type: 'word', letters: ['h', 'e', 'l', 'l', 'o'] },
            ],
        }

        expect(calculateAccuracy(typingData)).toBe(100)
    })

    it('returns 0% when no letters match', () => {
        const typingData: TypingData = {
            userActions: [],
            userNodes: [{ type: 'word', letters: ['x', 'x', 'x', 'x', 'x'] }],
            correctNodes: [
                { type: 'word', letters: ['h', 'e', 'l', 'l', 'o'] },
            ],
        }

        expect(calculateAccuracy(typingData)).toBe(0)
    })

    it('calculates partial accuracy correctly', () => {
        const typingData: TypingData = {
            userActions: [],
            userNodes: [{ type: 'word', letters: ['h', 'e', 'x', 'x', 'o'] }],
            correctNodes: [
                { type: 'word', letters: ['h', 'e', 'l', 'l', 'o'] },
            ],
        }

        // 3 out of 5 correct = 60%
        expect(calculateAccuracy(typingData)).toBe(60)
    })

    it('handles multiple words', () => {
        const typingData: TypingData = {
            userActions: [],
            userNodes: [
                { type: 'word', letters: ['h', 'i'] },
                { type: 'word', letters: ['b', 'y', 'e'] },
            ],
            correctNodes: [
                { type: 'word', letters: ['h', 'i'] },
                { type: 'word', letters: ['b', 'y', 'e'] },
            ],
        }

        expect(calculateAccuracy(typingData)).toBe(100)
    })

    it('returns 0 when correctNodes is empty', () => {
        const typingData: TypingData = {
            userActions: [],
            userNodes: [{ type: 'word', letters: ['h', 'i'] }],
            correctNodes: [],
        }

        expect(calculateAccuracy(typingData)).toBe(0)
    })
})

describe('calculateStatsForVerse', () => {
    it('calculates WPM correctly for normal typing', () => {
        // 10 letters typed in 2 seconds = 10/5 = 2 words in 2/60 minutes
        // WPM = 2 / (2/60) = 60 WPM
        // Use multiple actions with small gaps to avoid pause detection
        const typingData: TypingData = {
            userActions: [
                createAction('insertText', '2024-01-01T00:00:00.000Z'),
                createAction('insertText', '2024-01-01T00:00:00.500Z'),
                createAction('insertText', '2024-01-01T00:00:01.000Z'),
                createAction('insertText', '2024-01-01T00:00:01.500Z'),
                createAction('insertText', '2024-01-01T00:00:02.000Z'),
            ],
            userNodes: [
                { type: 'word', letters: ['a', 'b', 'c', 'd', 'e'] },
                { type: 'word', letters: ['f', 'g', 'h', 'i', 'j'] },
            ],
            correctNodes: [
                { type: 'word', letters: ['a', 'b', 'c', 'd', 'e'] },
                { type: 'word', letters: ['f', 'g', 'h', 'i', 'j'] },
            ],
        }

        const result = calculateStatsForVerse(createTypedVerse(typingData))

        expect(result).not.toBeNull()
        expect(result!.wpm).toBe(60)
        expect(result!.accuracy).toBe(100)
    })

    it('returns null when deleteSoftLineBackward invalidates most actions', () => {
        const typingData: TypingData = {
            userActions: [
                createAction('insertText', '2024-01-01T00:00:00.000Z'),
                createAction('insertText', '2024-01-01T00:00:01.000Z'),
                createAction(
                    'deleteSoftLineBackward',
                    '2024-01-01T00:00:02.000Z',
                ),
                createAction('insertText', '2024-01-01T00:00:03.000Z'),
            ],
            userNodes: [{ type: 'word', letters: ['h', 'i'] }],
            correctNodes: [{ type: 'word', letters: ['h', 'i'] }],
        }

        const result = calculateStatsForVerse(createTypedVerse(typingData))

        // Only 1 action after deleteSoftLineBackward, need at least 2
        expect(result).toBeNull()
    })

    it('calculates WPM only from actions after deleteSoftLineBackward', () => {
        // After reset: 3 seconds of typing
        // 10 letters / 5 = 2 words in 3/60 minutes = 40 WPM
        const typingData: TypingData = {
            userActions: [
                createAction('insertText', '2024-01-01T00:00:00.000Z'),
                createAction('insertText', '2024-01-01T00:00:01.000Z'),
                createAction(
                    'deleteSoftLineBackward',
                    '2024-01-01T00:00:02.000Z',
                ),
                // After reset - these are the only actions that count
                createAction('insertText', '2024-01-01T00:00:03.000Z'),
                createAction('insertText', '2024-01-01T00:00:04.000Z'),
                createAction('insertText', '2024-01-01T00:00:05.000Z'),
                createAction('insertText', '2024-01-01T00:00:06.000Z'), // 3 seconds total
            ],
            userNodes: [
                { type: 'word', letters: ['a', 'b', 'c', 'd', 'e'] },
                { type: 'word', letters: ['f', 'g', 'h', 'i', 'j'] },
            ],
            correctNodes: [
                { type: 'word', letters: ['a', 'b', 'c', 'd', 'e'] },
                { type: 'word', letters: ['f', 'g', 'h', 'i', 'j'] },
            ],
        }

        const result = calculateStatsForVerse(createTypedVerse(typingData))

        expect(result).not.toBeNull()
        // 10 letters / 5 = 2 words in 3 seconds (0.05 min) = 40 WPM
        expect(result!.wpm).toBe(40)
    })

    it('accounts for pause time correctly', () => {
        // 10 letters, with a 10-second pause that should only count as 1 second
        // Total effective time: 2 + 1 (pause) + 2 = 5 seconds
        const typingData: TypingData = {
            userActions: [
                createAction('insertText', '2024-01-01T00:00:00.000Z'),
                createAction('insertText', '2024-01-01T00:00:02.000Z'), // 2 sec
                createAction('insertText', '2024-01-01T00:00:12.000Z'), // 10 sec pause -> 1 sec
                createAction('insertText', '2024-01-01T00:00:14.000Z'), // 2 sec
            ],
            userNodes: [
                { type: 'word', letters: ['a', 'b', 'c', 'd', 'e'] },
                { type: 'word', letters: ['f', 'g', 'h', 'i', 'j'] },
            ],
            correctNodes: [
                { type: 'word', letters: ['a', 'b', 'c', 'd', 'e'] },
                { type: 'word', letters: ['f', 'g', 'h', 'i', 'j'] },
            ],
        }

        const result = calculateStatsForVerse(createTypedVerse(typingData))

        expect(result).not.toBeNull()
        // 10 letters / 5 = 2 words in 5 seconds (0.0833 min) = 24 WPM
        expect(result!.wpm).toBe(24)
    })

    it('returns null for null typing data', () => {
        const typedVerse = createTypedVerse({
            userActions: [],
            userNodes: [],
            correctNodes: [],
        })
        typedVerse.typingData = null

        const result = calculateStatsForVerse(typedVerse)

        expect(result).toBeNull()
    })

    it('returns null when duration is less than 1 second', () => {
        const typingData: TypingData = {
            userActions: [
                createAction('insertText', '2024-01-01T00:00:00.000Z'),
                createAction('insertText', '2024-01-01T00:00:00.500Z'),
            ],
            userNodes: [{ type: 'word', letters: ['h', 'i'] }],
            correctNodes: [{ type: 'word', letters: ['h', 'i'] }],
        }

        const result = calculateStatsForVerse(createTypedVerse(typingData))

        expect(result).toBeNull()
    })
})
