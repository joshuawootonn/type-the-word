import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { db } from '~/server/db'
import { userDailyActivity, users } from '~/server/db/schema'

import {
    consolidatePassages,
    formatVerseReference,
    parsePassageString,
    UserDailyActivityRepository,
} from './userDailyActivity.repository'

describe('parsePassageString', () => {
    it('parses simple book names', () => {
        expect(parsePassageString('Genesis 1:1')).toEqual({
            book: 'genesis',
            chapter: 1,
            verses: [1],
        })
        expect(parsePassageString('John 3:16')).toEqual({
            book: 'john',
            chapter: 3,
            verses: [16],
        })
    })

    it('parses numbered book names', () => {
        expect(parsePassageString('1 Corinthians 13:4')).toEqual({
            book: '1_corinthians',
            chapter: 13,
            verses: [4],
        })
        expect(parsePassageString('2 Timothy 3:16')).toEqual({
            book: '2_timothy',
            chapter: 3,
            verses: [16],
        })
    })

    it('parses multi-word book names', () => {
        expect(parsePassageString('Song Of Solomon 2:4')).toEqual({
            book: 'song_of_solomon',
            chapter: 2,
            verses: [4],
        })
    })

    it('parses verse ranges', () => {
        expect(parsePassageString('Luke 7:24-36')).toEqual({
            book: 'luke',
            chapter: 7,
            verses: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
        })
    })

    it('parses comma-separated verses', () => {
        expect(parsePassageString('Genesis 1:1, 3, 5')).toEqual({
            book: 'genesis',
            chapter: 1,
            verses: [1, 3, 5],
        })
    })

    it('parses mixed ranges and individual verses', () => {
        expect(parsePassageString('Romans 8:1-3, 5, 7-9')).toEqual({
            book: 'romans',
            chapter: 8,
            verses: [1, 2, 3, 5, 7, 8, 9],
        })
    })

    it('returns null for invalid input', () => {
        expect(parsePassageString('')).toBeNull()
        expect(parsePassageString('Invalid Book 1:1')).toBeNull()
        expect(parsePassageString('Genesis')).toBeNull()
        expect(parsePassageString('Genesis 1')).toBeNull()
    })
})

describe('consolidatePassages', () => {
    it('creates new passage for empty existing passages', () => {
        const result = consolidatePassages(
            [],
            {
                book: 'genesis',
                chapter: 1,
                verse: 1,
            },
            'esv',
        )
        expect(result).toEqual(['Genesis 1:1 (ESV)'])
    })

    it('consolidates consecutive verses into a range', () => {
        // Start with verses 1-3
        let result = consolidatePassages(
            [],
            {
                book: 'luke',
                chapter: 7,
                verse: 24,
            },
            'esv',
        )
        result = consolidatePassages(
            result,
            {
                book: 'luke',
                chapter: 7,
                verse: 25,
            },
            'esv',
        )
        result = consolidatePassages(
            result,
            {
                book: 'luke',
                chapter: 7,
                verse: 26,
            },
            'esv',
        )

        expect(result).toEqual(['Luke 7:24-26 (ESV)'])
    })

    it('consolidates when adding to existing range', () => {
        // This is the key case from the issue
        const result = consolidatePassages(
            ['Luke 7:24-36 (ESV)', 'Luke 7:37 (ESV)'],
            {
                book: 'luke',
                chapter: 7,
                verse: 38,
            },
            'esv',
        )

        expect(result).toEqual(['Luke 7:24-38 (ESV)'])
    })

    it('handles non-consecutive verses as separate entries', () => {
        let result = consolidatePassages(
            [],
            {
                book: 'genesis',
                chapter: 1,
                verse: 1,
            },
            'esv',
        )
        result = consolidatePassages(
            result,
            {
                book: 'genesis',
                chapter: 1,
                verse: 5,
            },
            'esv',
        )

        expect(result).toEqual(['Genesis 1:1, 5 (ESV)'])
    })

    it('keeps different chapters separate', () => {
        let result = consolidatePassages(
            [],
            {
                book: 'genesis',
                chapter: 1,
                verse: 1,
            },
            'esv',
        )
        result = consolidatePassages(
            result,
            {
                book: 'genesis',
                chapter: 2,
                verse: 1,
            },
            'esv',
        )

        expect(result).toEqual(['Genesis 1:1 (ESV)', 'Genesis 2:1 (ESV)'])
    })

    it('keeps different books separate', () => {
        let result = consolidatePassages(
            [],
            {
                book: 'genesis',
                chapter: 1,
                verse: 1,
            },
            'esv',
        )
        result = consolidatePassages(
            result,
            {
                book: 'exodus',
                chapter: 1,
                verse: 1,
            },
            'esv',
        )

        expect(result).toEqual(['Genesis 1:1 (ESV)', 'Exodus 1:1 (ESV)'])
    })

    it('handles complex consolidation with gaps', () => {
        // Verses 1, 2, 3, 5, 7, 8, 9 -> "1-3, 5, 7-9"
        let result = consolidatePassages(
            [],
            {
                book: 'genesis',
                chapter: 1,
                verse: 1,
            },
            'esv',
        )
        result = consolidatePassages(
            result,
            {
                book: 'genesis',
                chapter: 1,
                verse: 2,
            },
            'esv',
        )
        result = consolidatePassages(
            result,
            {
                book: 'genesis',
                chapter: 1,
                verse: 3,
            },
            'esv',
        )
        result = consolidatePassages(
            result,
            {
                book: 'genesis',
                chapter: 1,
                verse: 5,
            },
            'esv',
        )
        result = consolidatePassages(
            result,
            {
                book: 'genesis',
                chapter: 1,
                verse: 7,
            },
            'esv',
        )
        result = consolidatePassages(
            result,
            {
                book: 'genesis',
                chapter: 1,
                verse: 8,
            },
            'esv',
        )
        result = consolidatePassages(
            result,
            {
                book: 'genesis',
                chapter: 1,
                verse: 9,
            },
            'esv',
        )

        expect(result).toEqual(['Genesis 1:1-3, 5, 7-9 (ESV)'])
    })

    it('handles duplicate verses (idempotent)', () => {
        let result = consolidatePassages(
            [],
            {
                book: 'john',
                chapter: 3,
                verse: 16,
            },
            'esv',
        )
        result = consolidatePassages(
            result,
            {
                book: 'john',
                chapter: 3,
                verse: 16,
            },
            'esv',
        )
        result = consolidatePassages(
            result,
            {
                book: 'john',
                chapter: 3,
                verse: 16,
            },
            'esv',
        )

        expect(result).toEqual(['John 3:16 (ESV)'])
    })

    it('keeps different translations separate', () => {
        let result = consolidatePassages(
            [],
            {
                book: 'genesis',
                chapter: 1,
                verse: 1,
            },
            'esv',
        )
        result = consolidatePassages(
            result,
            {
                book: 'genesis',
                chapter: 1,
                verse: 1,
            },
            'niv',
        )

        expect(result).toContain('Genesis 1:1 (ESV)')
        expect(result).toContain('Genesis 1:1 (NIV)')
        expect(result).toHaveLength(2)
    })

    it('handles legacy passages without translation suffix', () => {
        // Legacy passages without translation are assumed to be ESV
        const result = consolidatePassages(
            ['Genesis 1:1'],
            {
                book: 'genesis',
                chapter: 1,
                verse: 2,
            },
            'esv',
        )

        expect(result).toEqual(['Genesis 1:1-2 (ESV)'])
    })
})

describe('formatVerseReference', () => {
    it('formats simple book names', () => {
        expect(formatVerseReference('genesis', 1, 1)).toBe('Genesis 1:1')
        expect(formatVerseReference('exodus', 20, 3)).toBe('Exodus 20:3')
        expect(formatVerseReference('john', 3, 16)).toBe('John 3:16')
    })

    it('formats book names with underscores (numbered books)', () => {
        expect(formatVerseReference('1_samuel', 17, 47)).toBe('1 Samuel 17:47')
        expect(formatVerseReference('2_kings', 5, 14)).toBe('2 Kings 5:14')
        expect(formatVerseReference('1_corinthians', 13, 4)).toBe(
            '1 Corinthians 13:4',
        )
        expect(formatVerseReference('2_timothy', 3, 16)).toBe('2 Timothy 3:16')
    })

    it('formats multi-word book names', () => {
        expect(formatVerseReference('song_of_solomon', 2, 4)).toBe(
            'Song Of Solomon 2:4',
        )
    })

    it('handles single chapter books', () => {
        expect(formatVerseReference('philemon', 1, 6)).toBe('Philemon 1:6')
        expect(formatVerseReference('jude', 1, 3)).toBe('Jude 1:3')
        expect(formatVerseReference('obadiah', 1, 4)).toBe('Obadiah 1:4')
    })

    it('handles various chapter and verse numbers', () => {
        expect(formatVerseReference('psalm', 119, 105)).toBe('Psalm 119:105')
        expect(formatVerseReference('isaiah', 53, 5)).toBe('Isaiah 53:5')
        expect(formatVerseReference('revelation', 22, 21)).toBe(
            'Revelation 22:21',
        )
    })
})

describe('UserDailyActivityRepository - Integration Tests', () => {
    const repository = new UserDailyActivityRepository(db)
    let testUserId: string

    beforeEach(async () => {
        // Create a test user
        testUserId = crypto.randomUUID()
        await db.insert(users).values({
            id: testUserId,
            email: `test-${testUserId}@example.com`,
            name: 'Test User',
        })
    })

    afterEach(async () => {
        // Clean up test data
        await db
            .delete(userDailyActivity)
            .where(eq(userDailyActivity.userId, testUserId))
        await db.delete(users).where(eq(users.id, testUserId))
    })

    describe('recordActivity - initial insert', () => {
        it('inserts a new record when no conflict exists', async () => {
            const date = new Date('2024-01-15T10:30:00Z')

            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                1,
                'esv',
                null,
            )

            const results = await repository.getByUserId(testUserId)

            expect(results).toHaveLength(1)
            expect(results[0]!.verseCount).toBe(1)
            expect(results[0]!.passages).toEqual(['Genesis 1:1 (ESV)'])
            expect(results[0]!.versesWithStats).toBe(0)
            expect(results[0]!.averageWpm).toBeNull()
        })

        it('inserts a new record with stats', async () => {
            const date = new Date('2024-01-15T10:30:00Z')
            const stats = { wpm: 60, accuracy: 95, correctedAccuracy: 98 }

            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                1,
                'esv',
                stats,
            )

            const results = await repository.getByUserId(testUserId)

            expect(results).toHaveLength(1)
            expect(results[0]!.verseCount).toBe(1)
            expect(results[0]!.passages).toEqual(['Genesis 1:1 (ESV)'])
            expect(results[0]!.versesWithStats).toBe(1)
            expect(results[0]!.averageWpm).toBe(60)
            expect(results[0]!.averageAccuracy).toBe(95)
            expect(results[0]!.averageCorrectedAccuracy).toBe(98)
        })

        it('normalizes date to UTC start of day', async () => {
            const date = new Date('2024-01-15T23:59:59.999Z')

            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                1,
                'esv',
                null,
            )

            const results = await repository.getByUserId(testUserId)

            expect(results).toHaveLength(1)
            // Should be normalized to start of day
            expect(results[0]!.date.toISOString()).toBe(
                '2024-01-15T00:00:00.000Z',
            )
        })
    })

    describe('recordActivity - conflict resolution (upsert)', () => {
        it('increments verseCount on conflict', async () => {
            const date = new Date('2024-01-15T10:30:00Z')

            // First insert
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                1,
                'esv',
                null,
            )
            // Second insert - same user/date (conflict)
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                2,
                'esv',
                null,
            )
            // Third insert
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                3,
                'esv',
                null,
            )

            const results = await repository.getByUserId(testUserId)

            expect(results).toHaveLength(1)
            expect(results[0]!.verseCount).toBe(3)
        })

        it('appends new passages on conflict', async () => {
            const date = new Date('2024-01-15T10:30:00Z')

            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                1,
                'esv',
                null,
            )
            await repository.recordActivity(
                testUserId,
                date,
                'exodus',
                20,
                3,
                'esv',
                null,
            )

            const results = await repository.getByUserId(testUserId)

            expect(results).toHaveLength(1)
            expect(results[0]!.passages).toEqual([
                'Genesis 1:1 (ESV)',
                'Exodus 20:3 (ESV)',
            ])
        })

        it('does NOT add duplicate passages', async () => {
            const date = new Date('2024-01-15T10:30:00Z')

            // Type the same verse multiple times (common when practicing)
            await repository.recordActivity(
                testUserId,
                date,
                'john',
                3,
                16,
                'esv',
                null,
            )
            await repository.recordActivity(
                testUserId,
                date,
                'john',
                3,
                16,
                'esv',
                null,
            )
            await repository.recordActivity(
                testUserId,
                date,
                'john',
                3,
                16,
                'esv',
                null,
            )

            const results = await repository.getByUserId(testUserId)

            expect(results).toHaveLength(1)
            // verseCount should be 3 (counts each time)
            expect(results[0]!.verseCount).toBe(3)
            // But passages should only have the verse once
            expect(results[0]!.passages).toEqual(['John 3:16 (ESV)'])
        })

        it('handles mix of duplicate and unique passages', async () => {
            const date = new Date('2024-01-15T10:30:00Z')

            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                1,
                'esv',
                null,
            )
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                1,
                'esv',
                null,
            ) // duplicate
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                2,
                'esv',
                null,
            )
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                1,
                'esv',
                null,
            ) // duplicate

            const results = await repository.getByUserId(testUserId)

            expect(results).toHaveLength(1)
            expect(results[0]!.verseCount).toBe(4)
            // Passages are now consolidated into ranges
            expect(results[0]!.passages).toEqual(['Genesis 1:1-2 (ESV)'])
        })

        it('consolidates consecutive verses into ranges', async () => {
            const date = new Date('2024-01-15T10:30:00Z')

            // Type Luke 7:24-38 as separate verses
            for (let verse = 24; verse <= 38; verse++) {
                await repository.recordActivity(
                    testUserId,
                    date,
                    'luke',
                    7,
                    verse,
                    'esv',
                    null,
                )
            }

            const results = await repository.getByUserId(testUserId)

            expect(results).toHaveLength(1)
            expect(results[0]!.verseCount).toBe(15)
            // Should be consolidated into a single range
            expect(results[0]!.passages).toEqual(['Luke 7:24-38 (ESV)'])
        })

        it('treats different times on same day as same record', async () => {
            // Morning activity
            const morning = new Date('2024-01-15T08:00:00Z')
            // Evening activity (same day)
            const evening = new Date('2024-01-15T20:00:00Z')

            await repository.recordActivity(
                testUserId,
                morning,
                'genesis',
                1,
                1,
                'esv',
                null,
            )
            await repository.recordActivity(
                testUserId,
                evening,
                'genesis',
                1,
                2,
                'esv',
                null,
            )

            const results = await repository.getByUserId(testUserId)

            // Both should be in the same record since same UTC day
            expect(results).toHaveLength(1)
            expect(results[0]!.verseCount).toBe(2)
            // Consecutive verses should be consolidated
            expect(results[0]!.passages).toEqual(['Genesis 1:1-2 (ESV)'])
        })

        it('creates separate records for different days', async () => {
            const day1 = new Date('2024-01-15T10:00:00Z')
            const day2 = new Date('2024-01-16T10:00:00Z')

            await repository.recordActivity(
                testUserId,
                day1,
                'genesis',
                1,
                1,
                'esv',
                null,
            )
            await repository.recordActivity(
                testUserId,
                day2,
                'genesis',
                1,
                2,
                'esv',
                null,
            )

            const results = await repository.getByUserId(testUserId)

            expect(results).toHaveLength(2)
            // Should be ordered by date descending
            expect(results[0]!.date.toISOString()).toBe(
                '2024-01-16T00:00:00.000Z',
            )
            expect(results[1]!.date.toISOString()).toBe(
                '2024-01-15T00:00:00.000Z',
            )
        })
    })

    describe('recordActivity - running averages', () => {
        it('calculates running average WPM correctly', async () => {
            const date = new Date('2024-01-15T10:30:00Z')

            // First verse: 60 WPM
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                1,
                'esv',
                {
                    wpm: 60,
                    accuracy: 100,
                    correctedAccuracy: 100,
                },
            )

            let results = await repository.getByUserId(testUserId)
            expect(results[0]!.averageWpm).toBe(60)

            // Second verse: 40 WPM -> average should be (60 + 40) / 2 = 50
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                2,
                'esv',
                {
                    wpm: 40,
                    accuracy: 100,
                    correctedAccuracy: 100,
                },
            )

            results = await repository.getByUserId(testUserId)
            expect(results[0]!.averageWpm).toBe(50)

            // Third verse: 50 WPM -> average should be (60 + 40 + 50) / 3 = 50
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                3,
                'esv',
                {
                    wpm: 50,
                    accuracy: 100,
                    correctedAccuracy: 100,
                },
            )

            results = await repository.getByUserId(testUserId)
            expect(results[0]!.averageWpm).toBe(50)
            // Passages should be consolidated
            expect(results[0]!.passages).toEqual(['Genesis 1:1-3 (ESV)'])
        })

        it('calculates running average accuracy correctly', async () => {
            const date = new Date('2024-01-15T10:30:00Z')

            // Three verses with different accuracies: 90, 100, 95
            // Running averages: 90 -> (90+100)/2=95 -> (90+100+95)/3=95
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                1,
                'esv',
                {
                    wpm: 60,
                    accuracy: 90,
                    correctedAccuracy: 92,
                },
            )
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                2,
                'esv',
                {
                    wpm: 60,
                    accuracy: 100,
                    correctedAccuracy: 100,
                },
            )
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                3,
                'esv',
                {
                    wpm: 60,
                    accuracy: 95,
                    correctedAccuracy: 97,
                },
            )

            const results = await repository.getByUserId(testUserId)

            expect(results[0]!.averageAccuracy).toBe(95) // (90 + 100 + 95) / 3 = 95
            expect(results[0]!.averageCorrectedAccuracy).toBe(96) // (92 + 100 + 97) / 3 ≈ 96.33 -> 96
        })

        it('increments versesWithStats only when stats are provided', async () => {
            const date = new Date('2024-01-15T10:30:00Z')

            // First: with stats
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                1,
                'esv',
                {
                    wpm: 60,
                    accuracy: 100,
                    correctedAccuracy: 100,
                },
            )

            let results = await repository.getByUserId(testUserId)
            expect(results[0]!.versesWithStats).toBe(1)
            expect(results[0]!.verseCount).toBe(1)

            // Second: without stats
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                2,
                'esv',
                null,
            )

            results = await repository.getByUserId(testUserId)
            expect(results[0]!.versesWithStats).toBe(1) // unchanged
            expect(results[0]!.verseCount).toBe(2)

            // Third: with stats
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                3,
                'esv',
                {
                    wpm: 40,
                    accuracy: 90,
                    correctedAccuracy: 95,
                },
            )

            results = await repository.getByUserId(testUserId)
            expect(results[0]!.versesWithStats).toBe(2) // incremented
            expect(results[0]!.verseCount).toBe(3)
        })

        it('does not corrupt averages when adding verse without stats after verses with stats', async () => {
            const date = new Date('2024-01-15T10:30:00Z')

            // Add two verses with stats
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                1,
                'esv',
                {
                    wpm: 60,
                    accuracy: 100,
                    correctedAccuracy: 100,
                },
            )
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                2,
                'esv',
                {
                    wpm: 40,
                    accuracy: 80,
                    correctedAccuracy: 90,
                },
            )

            // Add verse without stats
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                3,
                'esv',
                null,
            )

            const results = await repository.getByUserId(testUserId)

            // Averages should remain unchanged from the 2 verses with stats
            expect(results[0]!.averageWpm).toBe(50) // (60 + 40) / 2
            expect(results[0]!.averageAccuracy).toBe(90) // (100 + 80) / 2
            expect(results[0]!.averageCorrectedAccuracy).toBe(95) // (100 + 90) / 2
            expect(results[0]!.versesWithStats).toBe(2)
            expect(results[0]!.verseCount).toBe(3)
            // Passages should be consolidated
            expect(results[0]!.passages).toEqual(['Genesis 1:1-3 (ESV)'])
        })

        it('handles first insert without stats followed by insert with stats', async () => {
            const date = new Date('2024-01-15T10:30:00Z')

            // First: without stats
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                1,
                'esv',
                null,
            )

            let results = await repository.getByUserId(testUserId)
            expect(results[0]!.versesWithStats).toBe(0)
            expect(results[0]!.averageWpm).toBeNull()

            // Second: with stats - this is where conflict handling needs to work correctly
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                2,
                'esv',
                {
                    wpm: 60,
                    accuracy: 95,
                    correctedAccuracy: 98,
                },
            )

            results = await repository.getByUserId(testUserId)
            // The running average formula: (0 * 0 + 60) / (0 + 1) = 60
            expect(results[0]!.versesWithStats).toBe(1)
            expect(results[0]!.averageWpm).toBe(60)
            expect(results[0]!.averageAccuracy).toBe(95)
            // Passages should be consolidated
            expect(results[0]!.passages).toEqual(['Genesis 1:1-2 (ESV)'])
        })
    })

    describe('batchUpsert', () => {
        it('inserts multiple records', async () => {
            await repository.batchUpsert([
                {
                    userId: testUserId,
                    date: new Date('2024-01-15'),
                    verseCount: 5,
                    passages: ['Genesis 1:1', 'Genesis 1:2'],
                    averageWpm: 55,
                    averageAccuracy: 92,
                    versesWithStats: 3,
                },
                {
                    userId: testUserId,
                    date: new Date('2024-01-16'),
                    verseCount: 10,
                    passages: ['Exodus 20:1'],
                    averageWpm: 60,
                    averageAccuracy: 95,
                    versesWithStats: 8,
                },
            ])

            const results = await repository.getByUserId(testUserId)

            expect(results).toHaveLength(2)
        })

        it('overwrites existing record on conflict', async () => {
            const date = new Date('2024-01-15')

            // Insert initial record
            await repository.recordActivity(
                testUserId,
                date,
                'genesis',
                1,
                1,
                'esv',
                {
                    wpm: 30,
                    accuracy: 70,
                    correctedAccuracy: 75,
                },
            )

            // Batch upsert should OVERWRITE (not increment)
            await repository.batchUpsert([
                {
                    userId: testUserId,
                    date,
                    verseCount: 10,
                    passages: ['John 3:16'],
                    averageWpm: 60,
                    averageAccuracy: 95,
                    versesWithStats: 10,
                },
            ])

            const results = await repository.getByUserId(testUserId)

            expect(results).toHaveLength(1)
            expect(results[0]!.verseCount).toBe(10) // Overwrites, not increments
            expect(results[0]!.passages).toEqual(['John 3:16 (ESV)'])
            expect(results[0]!.averageWpm).toBe(60)
            expect(results[0]!.averageAccuracy).toBe(95)
            expect(results[0]!.versesWithStats).toBe(10)
        })

        it('handles null values for stats', async () => {
            await repository.batchUpsert([
                {
                    userId: testUserId,
                    date: new Date('2024-01-15'),
                    verseCount: 5,
                    passages: ['Genesis 1:1'],
                    averageWpm: null,
                    averageAccuracy: null,
                    averageCorrectedAccuracy: null,
                    versesWithStats: 0,
                },
            ])

            const results = await repository.getByUserId(testUserId)

            expect(results).toHaveLength(1)
            expect(results[0]!.averageWpm).toBeNull()
            expect(results[0]!.averageAccuracy).toBeNull()
            expect(results[0]!.versesWithStats).toBe(0)
        })
    })

    describe('getByUserId', () => {
        it('returns records ordered by date descending', async () => {
            // Insert in random order
            await repository.recordActivity(
                testUserId,
                new Date('2024-01-15'),
                'genesis',
                1,
                1,
                'esv',
                null,
            )
            await repository.recordActivity(
                testUserId,
                new Date('2024-01-20'),
                'genesis',
                1,
                2,
                'esv',
                null,
            )
            await repository.recordActivity(
                testUserId,
                new Date('2024-01-10'),
                'genesis',
                1,
                3,
                'esv',
                null,
            )
            await repository.recordActivity(
                testUserId,
                new Date('2024-01-25'),
                'genesis',
                1,
                4,
                'esv',
                null,
            )

            const results = await repository.getByUserId(testUserId)

            expect(results).toHaveLength(4)
            expect(results[0]!.date.toISOString()).toBe(
                '2024-01-25T00:00:00.000Z',
            )
            expect(results[1]!.date.toISOString()).toBe(
                '2024-01-20T00:00:00.000Z',
            )
            expect(results[2]!.date.toISOString()).toBe(
                '2024-01-15T00:00:00.000Z',
            )
            expect(results[3]!.date.toISOString()).toBe(
                '2024-01-10T00:00:00.000Z',
            )
        })

        it('returns empty array for user with no activity', async () => {
            const results = await repository.getByUserId(testUserId)

            expect(results).toEqual([])
        })
    })
})
